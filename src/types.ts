export interface Card {
  id: string;
  title: string;
  coreKnowledge: string;
  videoContent: string;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  order: number;
  cards: Card[];
}

export interface Course {
  topic: string;
  sections: Section[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
