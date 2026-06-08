import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Hobby } from "./hobby.entity";

@Entity({ name: "users" })
@Index("idx_users_first_name", ["firstName"])
@Index("idx_users_last_name", ["lastName"])
@Index("idx_users_nationality", ["nationality"])
@Index("idx_users_age", ["age"])
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "first_name", type: "varchar", length: 80 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 80 })
  lastName!: string;

  @Column({ type: "integer" })
  age!: number;

  @Column({ type: "varchar", length: 80 })
  nationality!: string;

  @Column({ type: "text" })
  avatar!: string;

  @ManyToMany(() => Hobby, (hobby) => hobby.users)
  @JoinTable({
    name: "user_hobbies",
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "hobby_id",
      referencedColumnName: "id",
    },
  })
  hobbies!: Hobby[];
}
