export interface ArticleData {
  title: string;
  markdown: string;
  summary: string;
  slug: string;
  tags: string[];
  feature_image?: string;
}

export interface Article {
  html: string;
  url: string;
}
