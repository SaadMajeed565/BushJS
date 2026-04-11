export interface HttpKernelContract {
  listen(port: number): Promise<void>;
}
