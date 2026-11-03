import os
import json
import torch
import numpy as np
from model import DGA1DCNN

def export():
    os.environ["PYTHONIOENCODING"] = "utf-8"
    os.makedirs("models", exist_ok=True)
    os.makedirs("public/models", exist_ok=True)
    os.makedirs("src/engine", exist_ok=True)
    
    ckpt_path = "models/dga_1dcnn.pth"
    if not os.path.exists(ckpt_path):
        print(f"Error: {ckpt_path} not found. Run python model.py first.")
        return

    checkpoint = torch.load(ckpt_path, map_location="cpu")
    num_classes = checkpoint.get("num_classes", 9)
    state_dict = checkpoint["model_state_dict"] if "model_state_dict" in checkpoint else checkpoint

    model = DGA1DCNN(num_classes=num_classes)
    model.load_state_dict(state_dict)
    model.eval()

    # 1. Export ONNX
    dummy_input = torch.randn(1, 24, 7, dtype=torch.float32)
    onnx_paths = ["models/dga_1dcnn.onnx", "public/models/dga_1dcnn.onnx"]
    for op in onnx_paths:
        torch.onnx.export(
            model,
            dummy_input,
            op,
            export_params=True,
            opset_version=18,
            input_names=["input"],
            output_names=["output"]
        )
        print(f"Exported ONNX model -> {op}")

    # 2. Export Weights to JSON for zero-dependency client-side TS forward pass
    weights_dict = {}
    for k, v in state_dict.items():
        weights_dict[k] = v.detach().cpu().numpy().tolist()

    json_path = "src/engine/model_weights.json"
    with open(json_path, "w") as f:
        json.dump(weights_dict, f)
    print(f"Exported model weights JSON -> {json_path}")

    # 3. Validation Check
    with torch.no_grad():
        test_out = model(dummy_input).numpy().tolist()[0]
    print(f"Inference smoke test sample output (length {len(test_out)}): {[round(x, 4) for x in test_out]}")
    print("Export pipeline complete!")

if __name__ == "__main__":
    export()
