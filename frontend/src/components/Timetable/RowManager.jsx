import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { HiPlus, HiTrash, HiPencil, HiCheck, HiX, HiMenuAlt4, HiDotsVertical } from 'react-icons/hi';
import timetableService from '../../services/timetableService';
import { toast } from 'react-toastify';

const RowManager = ({ rows = [], onRowsUpdated, onClose }) => {
  const { t } = useTranslation();
  const [editingRow, setEditingRow] = useState(null);
  const [items, setItems] = useState([]);
  const [newRow, setNewRow] = useState({ 
    roomName: '', 
    timeSlot: '', 
    order: 0 
  });
  const [isLoading, setIsLoading] = useState(false);

  // 🛡️ Sync local reorder state with props
  useEffect(() => {
    if (Array.isArray(rows)) {
      const sortedRows = [...rows].sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(sortedRows);
      setNewRow(prev => ({ ...prev, order: rows.length + 1 }));
    }
  }, [rows]);

  const handleReorder = async (newItems) => {
    setItems(newItems);
    try {
      const rowIds = newItems.map(item => item._id);
      await timetableService.updateRowOrder(rowIds);
      // We don't necessarily need to reload the whole grid here 
      // if the local reorder is enough, but we should notify parent of change.
      onRowsUpdated?.();
    } catch (err) {
      console.error('[RowManager] Reorder sync failed:', err);
      toast.error('Failed to save room order');
    }
  };

  const handleAddRow = async (e) => {
    e.preventDefault();
    if (!newRow?.roomName || !newRow?.timeSlot) return;
    
    setIsLoading(true);
    try {
      await timetableService.createRow(newRow);
      toast.success(t('success') || 'Row added successfully');
      setNewRow({ roomName: '', timeSlot: '', order: items.length + 2 });
      onRowsUpdated?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to add row');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRow = async (e) => {
    e.preventDefault();
    if (!editingRow?._id || !editingRow?.roomName || !editingRow?.timeSlot) return;

    setIsLoading(true);
    try {
      await timetableService.updateRow(editingRow._id, editingRow);
      toast.success(t('success') || 'Row updated');
      setEditingRow(null);
      onRowsUpdated?.();
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!id) return;
    if (!window.confirm(t('admin.rowManager.delete_confirm') || 'Permanently delete this row and all its sessions?')) return;

    setIsLoading(true);
    try {
      await timetableService.deleteRow(id);
      toast.success(t('success') || 'Row deleted');
      onRowsUpdated?.();
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh] border border-white/20"
      >
        {/* 🚀 Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Manage Rows</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Rooms & Time Slots</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <HiX className="text-2xl" />
          </button>
        </div>

        {/* 🚀 Scrollable List Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
          <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
            {items.map((row) => (
              <Reorder.Item
                key={row._id}
                value={row}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 p-4 rounded-3xl hover:shadow-xl transition-all group flex items-center gap-4 hover:border-blue-100 active:scale-[0.98]"
              >
                {/* 📌 Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-blue-300 transition-colors">
                  <HiMenuAlt4 className="text-2xl" />
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {editingRow?._id === row._id ? (
                    <div className="flex-1 grid grid-cols-2 gap-3 items-center">
                      <input
                        type="text"
                        value={editingRow.roomName}
                        onChange={(e) => setEditingRow({ ...editingRow, roomName: e.target.value })}
                        className="px-4 py-2 border border-blue-200 rounded-xl outline-none focus:ring-4 ring-blue-50 text-sm font-bold"
                      />
                      <input
                        type="text"
                        value={editingRow.timeSlot}
                        onChange={(e) => setEditingRow({ ...editingRow, timeSlot: e.target.value })}
                        className="px-4 py-2 border border-blue-200 rounded-xl outline-none focus:ring-4 ring-blue-50 text-sm font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-black text-gray-800 text-lg">{row?.roomName || 'Unnamed Room'}</div>
                      <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg w-fit mt-1">
                        {row?.timeSlot || '--:--'}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 shrink-0">
                    {editingRow?._id === row._id ? (
                      <>
                        <button onClick={handleUpdateRow} className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100 active:scale-90">
                          <HiCheck className="text-xl" />
                        </button>
                        <button onClick={() => setEditingRow(null)} className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all active:scale-90">
                          <HiX className="text-xl" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingRow(row)}
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                        >
                          <HiPencil className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row._id)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <HiTrash className="text-xl" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* 🚀 Empty Indicator */}
          {items.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-300 gap-4 border-2 border-dashed border-gray-50 rounded-[2rem]">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <HiDotsVertical className="text-4xl" />
              </motion.div>
              <p className="text-xs font-black uppercase tracking-widest">No rows to display</p>
            </div>
          )}
        </div>

        {/* 🚀 Sticky Footer Form */}
        <div className="p-8 bg-gray-50/80 border-t border-gray-100 backdrop-blur-sm">
          <form onSubmit={handleAddRow} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Name</label>
                <input
                  type="text"
                  value={newRow.roomName}
                  onChange={(e) => setNewRow({ ...newRow, roomName: e.target.value })}
                  className="w-full px-6 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 ring-blue-50 text-sm font-bold shadow-sm transition-all"
                  placeholder="e.g., Room A"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time Slot</label>
                <input
                  type="text"
                  value={newRow.timeSlot}
                  onChange={(e) => setNewRow({ ...newRow, timeSlot: e.target.value })}
                  className="w-full px-6 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 ring-blue-50 text-sm font-bold shadow-sm transition-all"
                  placeholder="e.g., 08:00 - 10:00"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto h-[52px] px-8 bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50"
              >
                <HiPlus className="text-lg" /> Add Row
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RowManager;
