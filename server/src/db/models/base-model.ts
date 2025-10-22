import { Model } from "objection";

export abstract class BaseModel extends Model {
  id!: string;
}
