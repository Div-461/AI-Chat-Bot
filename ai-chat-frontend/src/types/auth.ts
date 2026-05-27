export interface GoogleUser {
  sub:     string;   // unique Google user ID — used as IndexedDB key prefix
  email:   string;
  name:    string;
  picture: string;
  exp?:    number;
}
