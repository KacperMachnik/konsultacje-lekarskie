export interface User {
  id: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient';
  name: string;
}
