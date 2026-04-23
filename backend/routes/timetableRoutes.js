const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const catchAsync = require('../utils/catchAsync');

// GET /api/timetable — fetch full grid for a week
router.get('/', auth, isAdmin, catchAsync(timetableController.getTimetable));
router.post('/export', auth, isAdmin, catchAsync(timetableController.exportTimetable));

// POST /api/timetable/rows — create a new row
router.post('/rows', auth, isAdmin, catchAsync(timetableController.createRow));

// PUT /api/timetable/rows/:id — update a row
router.put('/rows/reorder', auth, isAdmin, catchAsync(timetableController.updateRowOrder));
router.put('/rows/:id', auth, isAdmin, catchAsync(timetableController.updateRow));

// DELETE /api/timetable/rows/:id — delete a row (cascades to cells)
router.delete('/rows/:id', auth, isAdmin, catchAsync(timetableController.deleteRow));

// PUT /api/timetable/cells — upsert a cell
router.put('/cells', auth, isAdmin, catchAsync(timetableController.upsertCell));

module.exports = router;
