from data.data_loader import DataLoader


def test_short_stay_boundary():
    loader = DataLoader()
    assert loader.categorize_los(0) == 0
    assert loader.categorize_los(7) == 0


def test_medium_stay_boundary():
    loader = DataLoader()
    assert loader.categorize_los(8) == 1
    assert loader.categorize_los(14) == 1


def test_long_stay_boundary():
    loader = DataLoader()
    assert loader.categorize_los(15) == 2
    assert loader.categorize_los(100) == 2


def test_missing_value_defaults_to_short_stay():
    loader = DataLoader()
    assert loader.categorize_los(float("nan")) == 0
