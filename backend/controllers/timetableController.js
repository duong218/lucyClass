const TimetableRow = require('../models/TimetableRow');
const TimetableCell = require('../models/TimetableCell');
const mongoose = require('mongoose');
const logAdminAction = require('../utils/logAdminAction');
const XLSX = require('xlsx');

// --- 🌍 UTC WEEK NORMALIZATION ---

/**
 * Normalizes any date to the Monday of its week at 00:00:00 UTC.
 * Handles ISO strings from frontend and Date objects.
 */
const normalizeToMondayUTC = (dateInput) => {
  const d = new Date(dateInput);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // Shift to Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
};

const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

// --- 📊 GET TIMETABLE ---

/**
 * GET /api/timetable?weekDate=2024-03-25T00:00:00.000Z
 * Returns all rows (sorted by order) with cells mapped by dayOfWeek.
 */
exports.getTimetable = async (req, res) => {
  try {
    const { weekDate } = req.query;

    if (!weekDate) {
      return res.status(400).json({ success: false, message: 'weekDate query parameter is required' });
    }

    const monday = normalizeToMondayUTC(weekDate);

    // Parallel fetch for performance
    const [rows, cells] = await Promise.all([
      TimetableRow.find().sort({ order: 1 }).lean(),
      TimetableCell.find({ weekDate: monday }).lean()
    ]);

    // O(1) cell lookup: Map keyed by "rowId-dayOfWeek"
    const cellMap = new Map();
    for (const cell of cells) {
      cellMap.set(`${cell.rowId}-${cell.dayOfWeek}`, cell);
    }

    // Build response structure
    const data = rows.map(row => {
      const cells = {};
      for (let day = 1; day <= 7; day++) {
        const cell = cellMap.get(`${row._id}-${day}`);
        cells[day] = cell ? { _id: cell._id, note: cell.note, color: cell.color } : null;
      }
      return {
        _id: row._id,
        roomName: row.roomName,
        timeSlot: row.timeSlot,
        order: row.order,
        cells
      };
    });

    res.json({ success: true, weekDate: monday.toISOString(), data });
  } catch (error) {
    console.error('[Timetable] getTimetable error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ➕ CREATE ROW ---

/**
 * POST /api/timetable/rows
 * Auto-assigns order = max(order) + 1 with retry on duplicate key.
 */
exports.createRow = async (req, res) => {
  try {
    const { roomName, timeSlot } = req.body;

    if (!roomName || !timeSlot) {
      return res.status(400).json({ success: false, message: 'roomName and timeSlot are required' });
    }

    // Auto-assign order with retry logic for race conditions
    let row;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const maxRow = await TimetableRow.findOne().sort({ order: -1 }).lean();
        const nextOrder = (maxRow?.order ?? 0) + 1;

        row = await TimetableRow.create({
          roomName: roomName.trim(),
          timeSlot: timeSlot.trim(),
          order: nextOrder
        });
        break; // Success — exit retry loop
      } catch (err) {
        if (err.code === 11000 && attempt < MAX_RETRIES - 1) {
          console.warn(`[Timetable] Order duplicate key collision, retrying (attempt ${attempt + 1})`);
          continue;
        }
        throw err; // Final attempt or non-duplicate error
      }
    }

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'CREATE_TIMETABLE_ROW',
      targetType: 'timetable_row',
      targetId: row._id,
      description: `Created row: ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.status(201).json({ success: true, data: row, message: 'Row created successfully' });
  } catch (error) {
    console.error('[Timetable] createRow error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- ✏️ UPDATE ROW ---

/**
 * PUT /api/timetable/rows/:id
 * Allows editing roomName and timeSlot only (order managed separately).
 */
exports.updateRow = async (req, res) => {
  try {
    const { roomName, timeSlot } = req.body;

    const updateData = {};
    if (roomName !== undefined) updateData.roomName = roomName.trim();
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const row = await TimetableRow.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'UPDATE_TIMETABLE_ROW',
      targetType: 'timetable_row',
      targetId: row._id,
      description: `Updated row: ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.json({ success: true, data: row, message: 'Row updated successfully' });
  } catch (error) {
    console.error('[Timetable] updateRow error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- ↕️ UPDATE ROW ORDER (BATCH) ---

/**
 * PUT /api/timetable/rows/reorder
 * Expects an array of row IDs in the desired order.
 * Updates the 'order' field for each row sequentially.
 */
exports.updateRowOrder = async (req, res) => {
  try {
    const { rowIds } = req.body;

    if (!Array.isArray(rowIds)) {
      return res.status(400).json({ success: false, message: 'rowIds must be an array' });
    }

    // Update in bulk using a loop of updates
    const updatePromises = rowIds.map((id, index) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid row ID format: ${id}`);
      }
      return TimetableRow.findByIdAndUpdate(id, { $set: { order: index + 1 } });
    });

    await Promise.all(updatePromises);

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'REORDER_TIMETABLE_ROWS',
      targetType: 'timetable_row',
      description: `Reordered ${rowIds.length} rows`,
      req
    });

    res.json({ success: true, message: 'Rows reordered successfully' });
  } catch (error) {
    console.error('[Timetable] updateRowOrder error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ❌ DELETE ROW (CASCADE) ---

/**
 * DELETE /api/timetable/rows/:id
 * Deletes the row AND all associated cells to prevent orphan data.
 */
exports.deleteRow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const row = await TimetableRow.findByIdAndDelete(id);
    if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

    // Cascade: delete all cells belonging to this row
    const deleteResult = await TimetableCell.deleteMany({ rowId: row._id });

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'DELETE_TIMETABLE_ROW',
      targetType: 'timetable_row',
      targetId: row._id,
      description: `Deleted row and ${deleteResult.deletedCount} related cells: ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.json({ success: true, message: 'Row and related cells deleted successfully' });
  } catch (error) {
    console.error('[Timetable] deleteRow error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 🎨 UPSERT CELL ---

/**
 * PUT /api/timetable/cells
 * Creates or updates a cell. Uses atomic findOneAndUpdate with upsert.
 */
exports.upsertCell = async (req, res) => {
  try {
    const { rowId, dayOfWeek, weekDate, note, color } = req.body;

    // --- Validation ---
    if (!rowId || !dayOfWeek || !weekDate) {
      return res.status(400).json({ success: false, message: 'rowId, dayOfWeek, and weekDate are required' });
    }

    const day = parseInt(dayOfWeek, 10);
    if (!Number.isInteger(day) || day < 1 || day > 7) {
      return res.status(400).json({ success: false, message: 'dayOfWeek must be an integer between 1 and 7' });
    }

    if (note !== undefined && note.length > 1000) {
      return res.status(400).json({ success: false, message: 'Note must be 1000 characters or less' });
    }

    if (color !== undefined && color !== null && !/^#[0-9a-f]{6}$/i.test(color)) {
      return res.status(400).json({ success: false, message: 'Color must be a valid hex code (e.g. #FF5733)' });
    }

    // Verify row exists
    if (!mongoose.Types.ObjectId.isValid(rowId)) {
      return res.status(400).json({ success: false, message: 'Invalid rowId format' });
    }
    const row = await TimetableRow.findById(rowId).lean();
    if (!row) {
      return res.status(404).json({ success: false, message: 'Row not found' });
    }

    const monday = normalizeToMondayUTC(weekDate);

    // Build update payload (only include defined fields)
    const updatePayload = {};
    if (note !== undefined) updatePayload.note = note.trim();
    if (color !== undefined) updatePayload.color = color;

    const cell = await TimetableCell.findOneAndUpdate(
      { rowId, dayOfWeek: day, weekDate: monday },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'UPDATE_TIMETABLE_CELL',
      targetType: 'timetable_cell',
      targetId: cell._id,
      description: `Updated cell: ${DAY_NAMES[day]} / ${row.roomName} / ${row.timeSlot}`,
      req
    });

    res.json({ success: true, data: cell, message: 'Cell saved successfully' });
  } catch (error) {
    console.error('[Timetable] upsertCell error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- 📥 EXPORT TIMETABLE TO EXCEL ---

/**
 * GET /api/timetable/export?weekDate=2024-03-25
 * Exports the timetable for a specific week as an .xlsx file.
 */
exports.exportTimetable = async (req, res) => {
  try {
    const { weekDate } = req.body;
    if (!weekDate) {
      return res.status(400).json({ success: false, message: 'weekDate is required' });
    }

    const monday = normalizeToMondayUTC(weekDate);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    // Fetch rows (sorted) and cells
    const [rows, cellsData] = await Promise.all([
      TimetableRow.find().sort({ order: 1 }).lean(),
      TimetableCell.find({ weekDate: monday }).lean()
    ]);

    // Lookup map
    const cellMap = new Map();
    for (const cell of cellsData) {
      cellMap.set(`${cell.rowId}-${cell.dayOfWeek}`, cell.note || '');
    }

    // Build Data Matrix (Array of Arrays)
    const aoa = [];
    
    // Header 1: Teacher + Dates
    const weekDatesArray = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const day = d.getUTCDate().toString().padStart(2, '0');
      const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      weekDatesArray.push(`${day}/${month}`);
    }
    aoa.push(['Teacher', ...weekDatesArray]);
    
    // Header 2: Empty + Day Names
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    aoa.push(['', ...dayNames]);

    // Data Rows
    let lastRoomPrefix = null;

    rows.forEach((row, index) => {
      // 🔍 DETECT ROOM GROUP CHANGE (logic: first word of roomName)
      const currentPrefix = row.roomName.split(' ')[0].toUpperCase();
      
      // Inject blank row if room type changes (and NOT the first row)
      if (lastRoomPrefix && lastRoomPrefix !== currentPrefix) {
        aoa.push(Array(8).fill('')); // Blank row across A-H
      }
      lastRoomPrefix = currentPrefix;

      const rowNoteArray = [];
      for (let day = 1; day <= 7; day++) {
        rowNoteArray.push(cellMap.get(`${row._id}-${day}`) || '');
      }
      
      aoa.push([
        `${row.roomName} • ${row.timeSlot}`,
        ...rowNoteArray
      ]);
    });

    // Create workbook & worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Set column widths (Approximate characters)
    ws['!cols'] = [
      { wch: 35 }, // Column A: Room/Slot
      ...Array(7).fill({ wch: 25 }) // B-H: Day Notes
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'S1.07 TIMETABLE');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // File name: Timetable_DD-MM-YYYY_to_DD-MM-YYYY.xlsx
    const fileName = `Timetable_${monday.getUTCDate()}-${monday.getUTCMonth()+1}-${monday.getUTCFullYear()}_to_${sunday.getUTCDate()}-${sunday.getUTCMonth()+1}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);

  } catch (error) {
    console.error('[Timetable] exportTimetable error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
