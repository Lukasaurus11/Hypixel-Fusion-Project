export interface Item {
  recipe_id: number;
  output_item: string;
  demand: number;
  profit: number;
  ingredients: string;
  id: string; // Adding ID field for image mapping
}

export interface GroupedItems {
  [key: string]: Item[];
}
