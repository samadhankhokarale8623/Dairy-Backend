import {
  addMilkEntry,
  getAllMilkEntries,
  getMilkByDate,
  updateMilkEntry,
  deleteMilkEntry
} from '../../models/milkModel/milkModel.js';

export const addMilk = async (req, reply) => {
  try {
    // Basic validation to ensure required fields are present
    const { user_id, date, timing, liters, rate, total } = req.body;
    if (!user_id || !date || !timing || !liters || !rate || total === undefined) {
      return reply.code(400).send({ error: 'Missing required milk entry fields.' });
    }
    
    const entry = await addMilkEntry(req.body);
    reply.code(201).send(entry);
  } catch (err) {
    // Handle specific error for unique constraint violation
    if (err.code === '23505') { // PostgreSQL unique violation error code
        return reply.code(409).send({ error: 'A milk entry for this user, date, and time already exists.' });
    }
    console.error("Failed to add milk entry:", err);
    reply.code(500).send({ error: 'Failed to add milk entry.' });
  }
};

export const getAllMilk = async (req, reply) => {
  try {
    const entries = await getAllMilkEntries();
    reply.send(entries);
  } catch (err) {
    console.error("Failed to fetch milk entries:", err);
    reply.code(500).send({ error: 'Failed to fetch milk entries.' });
  }
};

export const getMilkByDateHandler = async (req, reply) => {
  try {
    const { date } = req.query;
    if (!date) {
        return reply.code(400).send({ error: 'Date query parameter is required.' });
    }
    const entries = await getMilkByDate(date);
    reply.send(entries);
  } catch (err) {
    console.error("Failed to fetch by date:", err);
    reply.code(500).send({ error: 'Failed to fetch milk entries by date.' });
  }
};

export const updateMilk = async (req, reply) => {
  try {
    const { id } = req.params;
    if (!id) {
      return reply.code(400).send({ error: 'Milk entry ID is required for update.' });
    }
    const updatedEntry = await updateMilkEntry(id, req.body);
    if (!updatedEntry) {
        return reply.code(404).send({ error: 'Milk entry not found.' });
    }
    reply.send(updatedEntry);
  } catch (err) {
    console.error("Failed to update milk entry:", err);
    reply.code(500).send({ error: 'Failed to update milk entry.' });
  }
};

export const deleteMilk = async (req, reply) => {
  try {
    const { id } = req.params;
    if (!id) {
      return reply.code(400).send({ error: 'Milk entry ID is required for deletion.' });
    }
    const deletedEntry = await deleteMilkEntry(id);
    if (!deletedEntry) {
        return reply.code(404).send({ error: 'Milk entry not found.' });
    }
    reply.send({ message: "Milk entry deleted successfully", entry: deletedEntry });
  } catch (err) {
    console.error("Failed to delete milk entry:", err);
    reply.code(500).send({ error: 'Failed to delete milk entry.' });
  }
};