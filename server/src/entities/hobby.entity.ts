import { Column, Entity, Index, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user.entity";

@Entity({ name: "hobbies" })
@Index("idx_hobbies_name", ["name"], { unique: true })
export class Hobby {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @ManyToMany(() => User, (user) => user.hobbies)
  users!: User[];
}
