export type Counter = {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  created_at: string;
};

export type CountLog = {
  id: string;
  counter_id: string;
  user_id: string;
  count: number;
  logged_on: string; // YYYY-MM-DD
  created_at: string;
};
