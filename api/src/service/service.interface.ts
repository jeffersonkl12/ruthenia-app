export interface Service<TSelect> {
  findAll(): Promise<TSelect[]>;
  findById(id: number): Promise<TSelect | undefined>;
  create(data: unknown): Promise<TSelect>;
  update(id: number, data: unknown): Promise<TSelect | undefined>;
  remove(id: number): Promise<boolean>;
}
