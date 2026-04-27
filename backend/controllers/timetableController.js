const TimetableRow = require('../models/TimetableRow');
const TimetableCell = require('../models/TimetableCell');
const mongoose = require('mongoose');
const logAdminAction = require('../utils/logAdminAction');
const ExcelJS = require('exceljs');
const { cleanInput } = require('../utils/sanitize');

// --- 🌍 UTC WEEK NORMALIZATION ---

/**
 * Normalizes any date to the Monday of its week at 00:00:00 UTC.
 */
const normalizeToMondayUTC = (dateInput) => {
  const d = new Date(dateInput);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
};

const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

// Detect if a timeSlot belongs to AM or PM session
// Returns 'AM', 'PM', or 'OTHER'
const detectSession = (timeSlot) => {
  if (!timeSlot) return 'OTHER';
  // Extract first hour number from strings like "8:00 - 9:30", "08:00", "14:00-15:30", "2pm", etc.
  const match = timeSlot.match(/(\d{1,2})[:h]/i);
  if (!match) {
    // Try matching bare hour like "8am", "2pm"
    const amPmMatch = timeSlot.match(/(\d{1,2})\s*(am|pm)/i);
    if (amPmMatch) {
      const suffix = amPmMatch[2].toLowerCase();
      return suffix === 'am' ? 'AM' : 'PM';
    }
    return 'OTHER';
  }
  const hour = parseInt(match[1], 10);
  if (hour >= 0 && hour < 12) return 'AM';
  if (hour >= 12 && hour < 24) return 'PM';
  return 'OTHER';
};

// --- 📊 GET TIMETABLE ---

exports.getTimetable = async (req, res, next) => {
  try {
    const { weekDate } = req.query;
    if (!weekDate) {
      return res.status(400).json({ success: false, message: 'weekDate query parameter is required' });
    }

    const monday = normalizeToMondayUTC(weekDate);

    const [rows, cells] = await Promise.all([
      TimetableRow.find().sort({ branch: 1, order: 1 }).lean(),
      TimetableCell.find({ weekDate: monday }).lean()
    ]);

    const cellMap = new Map();
    for (const cell of cells) {
      cellMap.set(`${cell.rowId}-${cell.dayOfWeek}`, cell);
    }

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
        branch: row.branch || 'Cơ sở 1',
        order: row.order,
        cells
      };
    });

    res.json({ success: true, weekDate: monday.toISOString(), data });
  } catch (error) {
    console.error('[Timetable] getTimetable error:', error.message);
    next(error);
  }
};

// --- ➕ CREATE ROW ---

exports.createRow = async (req, res) => {
  try {
    const { roomName, timeSlot, branch } = req.body;

    if (!roomName || !timeSlot) {
      return res.status(400).json({ success: false, message: 'roomName and timeSlot are required' });
    }

    let row;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const maxRow = await TimetableRow.findOne().sort({ order: -1 }).lean();
        const nextOrder = (maxRow?.order ?? 0) + 1;

        row = await TimetableRow.create({
          roomName: cleanInput(roomName.trim()),
          timeSlot: cleanInput(timeSlot.trim()),
          branch: cleanInput((branch || 'Cơ sở 1').trim()),
          order: nextOrder
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < MAX_RETRIES - 1) {
          console.warn(`[Timetable] Order duplicate key collision, retrying (attempt ${attempt + 1})`);
          continue;
        }
        throw err;
      }
    }

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'CREATE_TIMETABLE_ROW',
      targetType: 'timetable_row',
      targetId: row._id,
      description: `Created row: [${row.branch}] ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.status(201).json({ success: true, data: row, message: 'Row created successfully' });
  } catch (error) {
    console.error('[Timetable] createRow error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- ✏️ UPDATE ROW ---

exports.updateRow = async (req, res) => {
  try {
    const { roomName, timeSlot, branch } = req.body;

    const updateData = {};
    if (roomName !== undefined) updateData.roomName = cleanInput(roomName.trim());
    if (timeSlot !== undefined) updateData.timeSlot = cleanInput(timeSlot.trim());
    if (branch !== undefined) updateData.branch = cleanInput(branch.trim());

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
      description: `Updated row: [${row.branch}] ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.json({ success: true, data: row, message: 'Row updated successfully' });
  } catch (error) {
    console.error('[Timetable] updateRow error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- ↕️ UPDATE ROW ORDER (BATCH) ---

exports.updateRowOrder = async (req, res, next) => {
  try {
    const { rowIds } = req.body;
    if (!Array.isArray(rowIds)) {
      return res.status(400).json({ success: false, message: 'rowIds must be an array' });
    }

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
    next(error);
  }
};

// --- ❌ DELETE ROW (CASCADE) ---

exports.deleteRow = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const row = await TimetableRow.findByIdAndDelete(id);
    if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

    const deleteResult = await TimetableCell.deleteMany({ rowId: row._id });

    await logAdminAction({
      adminId: req.admin.id,
      adminName: req.admin.username,
      action: 'DELETE_TIMETABLE_ROW',
      targetType: 'timetable_row',
      targetId: row._id,
      description: `Deleted row and ${deleteResult.deletedCount} related cells: [${row.branch}] ${row.roomName} - ${row.timeSlot}`,
      req
    });

    res.json({ success: true, message: 'Row and related cells deleted successfully' });
  } catch (error) {
    console.error('[Timetable] deleteRow error:', error.message);
    next(error);
  }
};

// --- 🎨 UPSERT CELL ---

exports.upsertCell = async (req, res) => {
  try {
    const { rowId, dayOfWeek, weekDate, note, color } = req.body;

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

    if (!mongoose.Types.ObjectId.isValid(rowId)) {
      return res.status(400).json({ success: false, message: 'Invalid rowId format' });
    }
    const row = await TimetableRow.findById(rowId).lean();
    if (!row) {
      return res.status(404).json({ success: false, message: 'Row not found' });
    }

    const monday = normalizeToMondayUTC(weekDate);

    const updatePayload = {};
    if (note !== undefined) updatePayload.note = cleanInput(note.trim());
    if (color !== undefined) updatePayload.color = cleanInput(color);

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
      description: `Updated cell: ${DAY_NAMES[day]} / [${row.branch}] ${row.roomName} / ${row.timeSlot}`,
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
 * POST /api/timetable/export
 * Xuất TKB theo tuần thành .xlsx.
 * Layout:
 *   - Mỗi cơ sở có tiêu đề riêng (merge across columns, màu xanh đậm)
 *   - Bên trong cơ sở, rows được nhóm theo buổi (AM/PM/OTHER)
 *   - Tiêu đề buổi: nền hồng nhạt
 *   - Khoảng trắng giữa các cơ sở
 */
exports.exportTimetable = async (req, res, next) => {
  try {
    const { weekDate } = req.body;
    if (!weekDate) {
      return res.status(400).json({ success: false, message: 'weekDate is required' });
    }

    const monday = normalizeToMondayUTC(weekDate);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const [rows, cellsData] = await Promise.all([
      TimetableRow.find().sort({ branch: 1, order: 1 }).lean(),
      TimetableCell.find({ weekDate: monday }).lean()
    ]);

    // Lookup map: "rowId-dayOfWeek" → note
    const cellMap = new Map();
    for (const cell of cellsData) {
      cellMap.set(`${cell.rowId}-${cell.dayOfWeek}`, cell.note || '');
    }

    // Build week date headers
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const dd = d.getUTCDate().toString().padStart(2, '0');
      const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      weekDates.push(`${dd}/${mm}`);
    }
    const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

    // Group rows: branch → session (AM/PM/OTHER) → rows[]
    const branchMap = new Map(); // branch → { AM: [], PM: [], OTHER: [] }
    const branchOrder = []; // preserve insertion order

    for (const row of rows) {
      const b = row.branch || 'Cơ sở 1';
      if (!branchMap.has(b)) {
        branchMap.set(b, { AM: [], PM: [], OTHER: [] });
        branchOrder.push(b);
      }
      const session = detectSession(row.timeSlot);
      branchMap.get(b)[session].push(row);
    }

    // ── Create workbook ──────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Timetable System';
    wb.created = new Date();
    const ws = wb.addWorksheet('THỜI KHÓA BIỂU', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    // Column widths: col A = label, B-H = days
    ws.columns = [
      { width: 32 },  // A: Room label
      { width: 22 },  // B: Mon
      { width: 22 },  // C: Tue
      { width: 22 },  // D: Wed
      { width: 22 },  // E: Thu
      { width: 22 },  // F: Fri
      { width: 22 },  // G: Sat
      { width: 22 },  // H: Sun
    ];

    // ── Color palette ────────────────────────────────────────────
    const COLOR = {
      branchBg:    'FF1C695C',  // brand green — branch header bg
      branchFg:    'FFFFFFFF',  // white text
      amBg:        'FFFFF3CD',  // warm yellow — AM session
      pmBg:        'FFFCE4EC',  // pink — PM session
      otherBg:     'FFE8EAF6',  // lavender — other session
      headerBg:    'FFE8F5F3',  // brand light green — col header
      headerFg:    'FF1C695C',
      borderColor: 'FFB2DFDB',
      rowAltBg:    'FFF7FAFC',
      todayBg:     'FFC8E6C9',
      cellBg:      'FFFFFFFF',
      emptyBg:     'FFF9F9F9',
    };

    // Helper: apply thin border to a row
    const applyBorder = (row, startCol = 1, endCol = 8) => {
      for (let c = startCol; c <= endCol; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top:    { style: 'thin', color: { argb: COLOR.borderColor } },
          left:   { style: 'thin', color: { argb: COLOR.borderColor } },
          bottom: { style: 'thin', color: { argb: COLOR.borderColor } },
          right:  { style: 'thin', color: { argb: COLOR.borderColor } },
        };
      }
    };

    // Helper: merge + style a header row spanning all 8 cols
    const addMergedHeader = (text, bgArgb, fgArgb, fontSize = 12) => {
      const rowNum = ws.rowCount + 1;
      const row = ws.addRow([text, '', '', '', '', '', '', '']);
      ws.mergeCells(rowNum, 1, rowNum, 8);
      const cell = row.getCell(1);
      cell.value = text;
      cell.font = { bold: true, size: fontSize, color: { argb: fgArgb } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top:    { style: 'medium', color: { argb: bgArgb } },
        bottom: { style: 'medium', color: { argb: bgArgb } },
      };
      row.height = 28;
      return row;
    };

    // ── Title row ────────────────────────────────────────────────
    const titleText = `THỜI KHÓA BIỂU TUẦN ${monday.getUTCDate().toString().padStart(2,'0')}/${(monday.getUTCMonth()+1).toString().padStart(2,'0')} – ${sunday.getUTCDate().toString().padStart(2,'0')}/${(sunday.getUTCMonth()+1).toString().padStart(2,'0')}/${sunday.getUTCFullYear()}`;
    addMergedHeader(titleText, 'FF0F4C3A', COLOR.branchFg, 14);

    // ── Column headers (date row 1) ──────────────────────────────
    const dateHeaderRow = ws.addRow(['Phòng / Khung giờ', ...weekDates]);
    dateHeaderRow.height = 20;
    dateHeaderRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 10, color: { argb: COLOR.headerFg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
      cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
    });
    applyBorder(dateHeaderRow);

    // ── Column headers (day name row 2) ─────────────────────────
    const dayNameRow = ws.addRow(['', ...DAY_LABELS]);
    dayNameRow.height = 18;
    dayNameRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 9, color: { argb: COLOR.headerFg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
      cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
    });
    applyBorder(dayNameRow);

    // ── Data rows, grouped by branch then session ────────────────
    const SESSION_LABELS = {
      AM:    '☀️  Buổi Sáng (AM)',
      PM:    '🌆  Buổi Chiều / Tối (PM)',
      OTHER: '🕐  Khác',
    };
    const SESSION_COLORS = {
      AM:    COLOR.amBg,
      PM:    COLOR.pmBg,
      OTHER: COLOR.otherBg,
    };
    const SESSION_FG = {
      AM:    'FF7D4E00',
      PM:    'FF880E4F',
      OTHER: 'FF283593',
    };

    for (let bi = 0; bi < branchOrder.length; bi++) {
      const branchName = branchOrder[bi];
      const sessions = branchMap.get(branchName);

      // Blank spacer between branches (skip for first)
      if (bi > 0) {
        const spacer = ws.addRow(Array(8).fill(''));
        spacer.height = 10;
      }

      // Branch header
      addMergedHeader(`🏫  ${branchName.toUpperCase()}`, COLOR.branchBg, COLOR.branchFg, 12);

      // Sessions: AM first, then PM, then OTHER
      for (const sessionKey of ['AM', 'PM', 'OTHER']) {
        const sessionRows = sessions[sessionKey];
        if (!sessionRows || sessionRows.length === 0) continue;

        // Session header (pink-ish row)
        const sessionLabel = SESSION_LABELS[sessionKey];
        const sessionBg = SESSION_COLORS[sessionKey];
        const sessionFg = SESSION_FG[sessionKey];

        const sRowNum = ws.rowCount + 1;
        const sRow = ws.addRow([sessionLabel, '', '', '', '', '', '', '']);
        ws.mergeCells(sRowNum, 1, sRowNum, 8);
        const sCell = sRow.getCell(1);
        sCell.value = sessionLabel;
        sCell.font = { bold: true, size: 10, italic: true, color: { argb: sessionFg } };
        sCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sessionBg } };
        sCell.border = {
          top:    { style: 'thin', color: { argb: sessionBg } },
          bottom: { style: 'medium', color: { argb: sessionFg } },
          left:   { style: 'thin', color: { argb: COLOR.borderColor } },
          right:  { style: 'thin', color: { argb: COLOR.borderColor } },
        };
        sRow.height = 22;

        // Data rows within this session
        sessionRows.forEach((row, rIdx) => {
          const notes = [];
          for (let day = 1; day <= 7; day++) {
            notes.push(cellMap.get(`${row._id}-${day}`) || '');
          }

          const label = `${row.roomName}  •  ${row.timeSlot}`;
          const dataRow = ws.addRow([label, ...notes]);
          dataRow.height = 50;

          // Style label cell
          const labelCell = dataRow.getCell(1);
          labelCell.font = { bold: true, size: 9, color: { argb: 'FF2D4A46' } };
          labelCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rIdx % 2 === 0 ? COLOR.cellBg : COLOR.rowAltBg } };

          // Style note cells
          for (let c = 2; c <= 8; c++) {
            const nc = dataRow.getCell(c);
            nc.font = { size: 9, color: { argb: 'FF374151' } };
            nc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            nc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rIdx % 2 === 0 ? COLOR.cellBg : COLOR.rowAltBg } };
          }

          applyBorder(dataRow);
        });
      }
    }

    // If no data
    if (rows.length === 0) {
      const emptyRowNum = ws.rowCount + 1;
      const emptyRow = ws.addRow(['Không có dữ liệu', '', '', '', '', '', '', '']);
      ws.mergeCells(emptyRowNum, 1, emptyRowNum, 8);
      emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' } };
      emptyRow.height = 40;
    }

    // ── Freeze top rows ──────────────────────────────────────────
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }];

    // ── Generate file ────────────────────────────────────────────
    const buf = await wb.xlsx.writeBuffer();

    const fmt = (d) => `${d.getUTCDate().toString().padStart(2,'0')}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCFullYear()}`;
    const fileName = `TKB_${fmt(monday)}_den_${fmt(sunday)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);

  } catch (error) {
    console.error('[Timetable] exportTimetable error:', error.message);
    next(error);
  }
};