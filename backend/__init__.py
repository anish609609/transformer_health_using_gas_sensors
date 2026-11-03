"""
Industrial Substation AI Digital Twin - Backend Package
Provides PyTorch 1D-CNN fault classification, synthetic DGA telemetry generation,
IEEE C57.104-2019 / IEC 60599 / Duval Triangle 1 standards validation,
and automated substation mitigation protocol dispatching.
"""

from .model import DGA1DCNN
from .generate_data import generate_sequence, build_dataset, SCENARIOS, GAS_NAMES
from .validator import StandardsValidator
from .action_engine import ActionEngine

__all__ = [
    "DGA1DCNN",
    "generate_sequence",
    "build_dataset",
    "SCENARIOS",
    "GAS_NAMES",
    "StandardsValidator",
    "ActionEngine"
]
