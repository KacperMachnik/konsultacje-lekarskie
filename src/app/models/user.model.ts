export interface User {
  id: number;
  email: string;
  password: string;
  role: 'doctor' | 'patient';
  name: string;
}
