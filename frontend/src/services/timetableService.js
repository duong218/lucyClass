import api from './api';

const timetableService = {
  /**
   * Normalizes the API response to ensure a consistent { rows, cells } structure.
   * Handles both Format A: { rows, cells } and Format B: { success, data: { rows, cells } }.
   */
  normalizeResponse: (response) => {
    // 🛡️ EXPLICT BACKEND FORMAT HANDLING
    // Structure: { success: true, data: [ { ..., cells: { "1": {}, "2": null } } ] }
    
    const body = response?.data;
    
    // Fallback for missing body or missing data array
    if (!body || !Array.isArray(body.data)) {
      console.warn('[TimetableService] Invalid response format:', body);
      return { rows: [], cells: [] };
    }

    const rows = [];
    const cells = [];

    body.data.forEach((row) => {
      if (!row) return;

      // Extract row meta (exclude nested cells)
      const { cells: rowCells, ...rowData } = row;
      rows.push(rowData);

      // Flatten cells map into array
      if (rowCells && typeof rowCells === 'object') {
        Object.entries(rowCells).forEach(([dayKey, cellData]) => {
          if (cellData && typeof cellData === 'object') {
            cells.push({
              ...cellData,
              color: cellData.color || null,
              rowId: row._id,
              dayOfWeek: parseInt(dayKey, 10),
            });
          }
        });
      }
    });

    return { rows, cells };
  },

  // Fetch full grid for a specific week
  getTimetable: async (weekDate) => {
    try {
      const response = await api.get('/timetable', { params: { weekDate } });
      return timetableService.normalizeResponse(response);
    } catch (error) {
      console.error('[TimetableService] getTimetable failed:', error);
      return { rows: [], cells: [] };
    }
  },

  // Row Management
  createRow: async (data) => {
    const response = await api.post('/timetable/rows', data);
    return response.data;
  },

  updateRow: async (id, data) => {
    const response = await api.put(`/timetable/rows/${id}`, data);
    return response.data;
  },

  deleteRow: async (id) => {
    const response = await api.delete(`/timetable/rows/${id}`);
    return response.data;
  },

  updateRowOrder: async (rowIds) => {
    const response = await api.put('/timetable/rows/reorder', { rowIds });
    return response.data;
  },

  // Cell Management
  upsertCell: async (data) => {
    const response = await api.put('/timetable/cells', data);
    return response.data;
  },

  deleteCell: async (id) => {
    const response = await api.delete(`/timetable/cells/${id}`);
    return response.data;
  },

  // Export to Excel
  exportTimetable: async (weekDate) => {
    // We respond with a blob for file download
    const response = await api.post('/timetable/export', { weekDate }, {
      responseType: 'blob'
    });
    return response.data; // This is the Blob
  }
};

export default timetableService;
