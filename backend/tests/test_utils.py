import numpy as np
import pandas as pd
import pytest

from utils import utils as utils_module
from utils.utils import preprocess_input, explain_prediction


@pytest.fixture(autouse=True)
def reset_globals(monkeypatch):
    monkeypatch.setattr(utils_module, "REQUIRED_FEATURES", ["age", "Body_Mass_Index", "Gender"])
    monkeypatch.setattr(utils_module, "scaler", None)


def test_preprocess_input_valid():
    data = {"age": 45, "Body_Mass_Index": 24.5, "Gender": "Male"}
    df = preprocess_input(data)
    assert df.iloc[0]["age"] == 45
    assert df.iloc[0]["Gender"] == 1


def test_preprocess_input_rejects_age_out_of_range():
    data = {"age": 200, "Body_Mass_Index": 24.5, "Gender": "Male"}
    with pytest.raises(ValueError, match="age"):
        preprocess_input(data)


def test_preprocess_input_rejects_bmi_out_of_range():
    data = {"age": 45, "Body_Mass_Index": 5, "Gender": "Female"}
    with pytest.raises(ValueError, match="Body_Mass_Index"):
        preprocess_input(data)


class FakeExplainer:
    def __init__(self, values_per_class):
        self.values_per_class = values_per_class

    def shap_values(self, df):
        return self.values_per_class


def test_explain_prediction_uses_predicted_class_shap_values(monkeypatch):
    # Regression test: explain_prediction used to always read shap_values[0]
    # regardless of which class the model predicted.
    df = pd.DataFrame([{"age": 1.0, "Body_Mass_Index": 1.0}])
    class_0 = np.array([[0.1, 0.2]])
    class_1 = np.array([[0.3, 0.4]])
    class_2 = np.array([[0.5, 0.6]])
    monkeypatch.setattr(utils_module, "explainer", FakeExplainer([class_0, class_1, class_2]))

    explanation = explain_prediction(df, predicted_class=2)

    assert explanation["shap_values"] == class_2.tolist()
    assert explanation["features"] == ["age", "Body_Mass_Index"]
