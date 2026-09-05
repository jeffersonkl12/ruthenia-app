export interface Repository<TSelect, TNew, TUpdate> {
  findAll(): Promise<TSelect[]>;
  findById(id: number): Promise<TSelect | undefined>;
  create(data: TNew): Promise<TSelect>;
  update(id: number, data: TUpdate): Promise<TSelect | undefined>;
  remove(id: number): Promise<boolean>;
}
