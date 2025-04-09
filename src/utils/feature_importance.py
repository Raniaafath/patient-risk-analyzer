import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use Agg backend for non-interactive plotting
import matplotlib.pyplot as plt
import seaborn as sns
import xgboost as xgb
import os

class FeatureImportanceAnalyzer:
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        
    def analyze_importance(self, save_dir=None):
        """Analyze and visualize feature importance"""
        try:
            if isinstance(self.model, xgb.XGBClassifier):
                importance = self.model.feature_importances_
            else:
                raise ValueError("Model must be an XGBoost classifier")
                
            # Create DataFrame with feature importance
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importance
            })
            
            # Sort by importance
            feature_importance = feature_importance.sort_values('importance', ascending=False)
            
            # Plot feature importance
            if save_dir:
                self._plot_feature_importance(feature_importance, save_dir)
            
            return feature_importance
        except Exception as e:
            print(f"Error in analyze_importance: {str(e)}")
            return pd.DataFrame(columns=['feature', 'importance'])
        
    def _plot_feature_importance(self, feature_importance, save_dir=None):
        """Plot feature importance"""
        try:
            plt.figure(figsize=(12, 6))
            
            # Plot top 10 features using a simpler barplot configuration
            sns.barplot(
                x='importance',
                y='feature',
                data=feature_importance.head(10),
                palette='viridis'
            )
            
            plt.title('Top 10 Most Important Features')
            plt.xlabel('Importance')
            plt.ylabel('Feature')
            plt.tight_layout()
            
            if save_dir:
                os.makedirs(save_dir, exist_ok=True)
                plt.savefig(os.path.join(save_dir, 'feature_importance.png'), dpi=300, bbox_inches='tight')
            plt.close()
        except Exception as e:
            print(f"Error in _plot_feature_importance: {str(e)}")
            plt.close()
        
    def plot_feature_correlation(self, X, save_dir=None):
        """Plot feature correlation heatmap"""
        try:
            plt.figure(figsize=(12, 8))
            correlation_matrix = X.corr()
            sns.heatmap(
                correlation_matrix,
                annot=True,
                cmap='coolwarm',
                center=0,
                fmt='.2f'
            )
            plt.title('Feature Correlation Heatmap')
            plt.tight_layout()
            
            if save_dir:
                os.makedirs(save_dir, exist_ok=True)
                plt.savefig(os.path.join(save_dir, 'feature_correlation.png'), dpi=300, bbox_inches='tight')
            plt.close()
        except Exception as e:
            print(f"Error in plot_feature_correlation: {str(e)}")
            plt.close()

