export interface AuthUser {
  id: string;
  [key: string]: any;
}

export interface UserProvider {
  findById(id: string): Promise<any>;
  validate?(credentials: Record<string, any>): Promise<any>;
}
