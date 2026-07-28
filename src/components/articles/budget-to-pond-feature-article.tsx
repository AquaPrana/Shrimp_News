import { BudgetToPondFeature } from "@/components/articles/budget-to-pond-feature";
import styles from "@/components/articles/BudgetToPondFeatureArticle.module.css";

export function BudgetToPondFeatureArticle() {
  return (
    <div className={styles.featureArticle}>
      <BudgetToPondFeature />
    </div>
  );
}
