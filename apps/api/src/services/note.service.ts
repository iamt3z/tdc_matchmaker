import { randomUUID } from "node:crypto";

import type {
  CreateCustomerNoteInput,
  CustomerNote,
} from "@tdc/types";

import { customerRepository } from "../repositories/customer.repository";
import { noteRepository } from "../repositories/note.repository";
import { AppError } from "../middleware/error-handler";

/**
 * Notes are scoped to the customer the matchmaker owns.
 * matchmakerId always comes from the authenticated token, never the body.
 */
export const noteService = {
  /**
   * List notes for an owned customer.
   * Notes written by other matchmakers on the same customer are still
   * visible to the current owner so handoffs remain coherent.
   */
  async listForCustomer(
    customerId: string,
    matchmakerId: string,
  ): Promise<CustomerNote[]> {
    const customer = await customerRepository.findById(customerId);

    // Ownership check: only the assigned matchmaker may read notes.
    if (!customer || customer.assignedMatchmakerId !== matchmakerId) {
      throw new AppError(
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
        404,
      );
    }

    const notes = await noteRepository.findByCustomerId(customerId);

    return notes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /**
   * Create a note against an owned customer.
   */
  async create(
    customerId: string,
    input: CreateCustomerNoteInput,
    matchmakerId: string,
  ): Promise<CustomerNote> {
    const customer = await customerRepository.findById(customerId);

    if (!customer || customer.assignedMatchmakerId !== matchmakerId) {
      throw new AppError(
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
        404,
      );
    }

    const now = new Date().toISOString();

    const note: CustomerNote = {
      id: randomUUID(),
      customerId,
      // Authenticated principal is the only trusted source for matchmakerId.
      matchmakerId,
      type: input.type,
      subject: input.subject,
      content: input.content,
      followUpAt: input.followUpAt,
      followUpAction: input.followUpAction,
      followUpCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await noteRepository.create(note);

    // Re-read the customer before updating noteIds so concurrent creates
    // are less likely to overwrite each other's array entries.
    // Full atomicity across notes.json and customers.json is not available
    // with the current JsonStore (separate files, separate write queues).
    const latest = await customerRepository.findById(customerId);
    const priorNoteIds = latest?.noteIds ?? customer.noteIds;

    await customerRepository.update(customerId, {
      noteIds: [...priorNoteIds, created.id],
      updatedAt: now,
    });

    return created;
  },
};
