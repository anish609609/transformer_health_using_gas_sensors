import torch
import torch.nn as nn
import torch.optim as optim
import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

try:
    from backend.generate_data import build_dataset, SCENARIOS
    DEFAULT_NUM_CLASSES = len(SCENARIOS)
except ImportError:
    try:
        from generate_data import build_dataset, SCENARIOS
        DEFAULT_NUM_CLASSES = len(SCENARIOS)
    except ImportError:
        build_dataset = None
        SCENARIOS = {}
        DEFAULT_NUM_CLASSES = 9

class DGA1DCNN(nn.Module):
    def __init__(self, num_gases=7, window_size=24, num_classes=DEFAULT_NUM_CLASSES):
        super(DGA1DCNN, self).__init__()
        self.num_classes = num_classes
        
        # 1D Convolutional Feature Extractor over 24-hour temporal rolling window
        self.conv1 = nn.Conv1d(in_channels=num_gases, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(32)
        self.relu = nn.ReLU()
        self.pool1 = nn.MaxPool1d(kernel_size=2)  # 24 -> 12
        
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm1d(64)
        self.pool2 = nn.MaxPool1d(kernel_size=2)  # 12 -> 6
        
        self.conv3 = nn.Conv1d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm1d(128)
        
        # Fully Connected Classification Head
        fc_in_dim = 128 * (window_size // 4)
        self.fc1 = nn.Linear(fc_in_dim, 64)
        self.dropout = nn.Dropout(p=0.2)
        self.fc2 = nn.Linear(64, num_classes)
        
    def forward(self, x):
        # x shape: (Batch, Sequence=24, Channels=7) -> transpose to (Batch, 7, 24)
        if x.dim() == 2:
            x = x.unsqueeze(0)
        x = x.permute(0, 2, 1)
        
        x = self.pool1(self.relu(self.bn1(self.conv1(x))))
        x = self.pool2(self.relu(self.bn2(self.conv2(x))))
        x = self.relu(self.bn3(self.conv3(x)))
        
        x = x.reshape(x.size(0), -1)
        x = self.dropout(self.relu(self.fc1(x)))
        out = self.fc2(x)
        return out

def train_model(epochs=25, samples_per_class=200):
    print("Generating synthetic DGA time-series training dataset...")
    X, y = build_dataset(samples_per_class=samples_per_class)
    
    # Split into train & validation sets (80/20)
    split_idx = int(0.8 * len(X))
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.long)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_val, dtype=torch.long)
    
    model = DGA1DCNN(num_classes=len(SCENARIOS))
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0015, weight_decay=1e-4)
    
    batch_size = 32
    num_batches = len(X_train) // batch_size
    
    print(f"Training 1D-CNN ({len(SCENARIOS)} classes, {epochs} epochs)...")
    for epoch in range(epochs):
        model.train()
        permutation = torch.randperm(X_train_t.size(0))
        epoch_loss = 0.0
        
        for i in range(num_batches):
            indices = permutation[i * batch_size:(i + 1) * batch_size]
            batch_x, batch_y = X_train_t[indices], y_train_t[indices]
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
            
        # Validation accuracy check
        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            model.eval()
            with torch.no_grad():
                val_out = model(X_val_t)
                val_loss = criterion(val_out, y_val_t).item()
                preds = torch.argmax(val_out, dim=1)
                acc = (preds == y_val_t).float().mean().item() * 100
            print(f"Epoch {epoch+1:2d}/{epochs} - Train Loss: {epoch_loss/num_batches:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {acc:.2f}%")
        
    save_dir = os.path.join(ROOT_DIR, "models")
    os.makedirs(save_dir, exist_ok=True)
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "num_classes": len(SCENARIOS),
        "scenarios": SCENARIOS
    }
    save_path = os.path.join(save_dir, "dga_1dcnn.pth")
    torch.save(checkpoint, save_path)
    print(f"Model successfully saved to {save_path} with {len(SCENARIOS)} fault classes!")

if __name__ == "__main__":
    train_model()
