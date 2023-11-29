import { v4 as uuidv4, validate } from "uuid";

export const isValidUUID = (id: string) => validate(id);
export const generateUUID = () => uuidv4();
