import type { ISODateTime } from "./common";

/**
 * The kind of interaction recorded by a matchmaker.
 */
export type NoteType =
  | "CALL"
  | "MEETING"
  | "EMAIL"
  | "OTHER";

/**
 * Records a matchmaker's interaction with a customer.
 */
export interface CustomerNote {
  id: string;

  customerId: string;
  matchmakerId: string;

  type: NoteType;

  subject: string;
  content: string;

  /**
   * Optional follow-up information.
   */
  followUpAt?: ISODateTime;
  followUpAction?: string;
  followUpCompleted?: boolean;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Payload submitted by the frontend when creating a note.
 */
export type CreateCustomerNoteInput = Pick<
  CustomerNote,
  | "type"
  | "subject"
  | "content"
  | "followUpAt"
  | "followUpAction"
>;

/**
 * Fields that can be edited after a note has been created.
 */
export type UpdateCustomerNoteInput = Partial<
  Pick<
    CustomerNote,
    | "type"
    | "subject"
    | "content"
    | "followUpAt"
    | "followUpAction"
    | "followUpCompleted"
  >
>;