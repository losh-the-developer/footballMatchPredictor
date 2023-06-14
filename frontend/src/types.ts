export interface IData {
    leagues: {
      name: string;
      country: string;
      matches?: {
        homeTeam: string;
        awayTeam: string;
        score: string;
      }[];
    }[];
  }
  