import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getRules, createRule, updateRule, deleteRule
} from '../api.js';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#14b8a6', '#3b82f6',
  '#64748b', '#94a3b8', '#1e1e2e', '#22c55e'
];

const MATCH_TYPES = ['contains', 'starts_with', 'ends_with', 'regex'];
const FIELDS = ['description', 'merchant', 'amount'];

export default function CategoryEditor() {
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New category form
  const [newCat, setNewCat] = useState({ name: '', color: '#6366f1', icon: '💰', type: 'expense' });
  const [addingCat, setAddingCat] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  // Edit category
  const [editingCat, setEditingCat] = useState(null);

  // New rule form per category
  const [newRules, setNewRules] = useState({}); // { [catId]: { pattern, match_type, field } }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, rulesRes] = await Promise.all([getCategories(), getRules()]);
      setCategories(catRes.data);
      setRules(rulesRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) return;
    try {
      setSavingCat(true);
      const res = await createCategory(newCat);
      setCategories(prev => [...prev, { ...res.data, transaction_count: 0, total_spent_month: 0 }]);
      setNewCat({ name: '', color: '#6366f1', icon: '💰', type: 'expense' });
      setAddingCat(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setSavingCat(false);
    }
  };

  const handleSaveCategory = async (cat) => {
    try {
      await updateCategory(cat.id, {
        name: cat.name, color: cat.color, icon: cat.icon, type: cat.type
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...cat } : c));
      setEditingCat(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Transactions will be uncategorized.')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setRules(prev => prev.filter(r => r.category_id !== id));
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const handleAddRule = async (catId) => {
    const ruleData = newRules[catId];
    if (!ruleData?.pattern?.trim()) return;
    try {
      const res = await createRule({
        category_id: catId,
        pattern: ruleData.pattern,
        match_type: ruleData.match_type || 'contains',
        field: ruleData.field || 'description',
        priority: 0
      });
      setRules(prev => [...prev, res.data]);
      setNewRules(prev => ({ ...prev, [catId]: { pattern: '', match_type: 'contains', field: 'description' } }));
    } catch (err) {
      setError('Failed to create rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const ruleId = parseInt(draggableId.replace('rule-', ''));
    const destCatId = parseInt(destination.droppableId.replace('rules-', ''));
    const sourceCatId = parseInt(source.droppableId.replace('rules-', ''));

    if (sourceCatId === destCatId && source.index === destination.index) return;

    try {
      // Update the rule's category
      await updateRule(ruleId, { category_id: destCatId });
      setRules(prev => prev.map(r =>
        r.id === ruleId
          ? { ...r, category_id: destCatId }
          : r
      ));
    } catch (err) {
      setError('Failed to move rule');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af' }}>
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Categories & Rules</h1>
          <p style={{ color: '#6b7280', marginTop: 2 }}>
            Manage categories and auto-categorization rules
          </p>
        </div>
        <button
          onClick={() => setAddingCat(!addingCat)}
          style={btnPrimary}
        >
          {addingCat ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 16
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
        </div>
      )}

      {/* Add Category Form */}
      {addingCat && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '2px solid #6366f1'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>New Category</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 160px' }}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={newCat.name}
                onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={labelStyle}>Icon (emoji)</label>
              <input
                type="text"
                value={newCat.icon}
                onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
                style={{ ...inputStyle, width: 70 }}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={labelStyle}>Type</label>
              <select value={newCat.type} onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewCat(p => ({ ...p, color: c }))}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, border: 'none',
                      cursor: 'pointer', outline: newCat.color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button onClick={handleAddCategory} disabled={savingCat} style={btnPrimary}>
              {savingCat ? 'Saving...' : 'Create Category'}
            </button>
            <button onClick={() => setAddingCat(false)} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      {/* Categories with Rules */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map(cat => {
            const catRules = rules.filter(r => r.category_id === cat.id);
            const isEditing = editingCat?.id === cat.id;
            const editData = isEditing ? editingCat : cat;
            const ruleForm = newRules[cat.id] || { pattern: '', match_type: 'contains', field: 'description' };

            return (
              <div key={cat.id} style={{
                background: '#fff', borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                borderLeft: `4px solid ${cat.color}`
              }}>
                {/* Category Header */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        value={editData.icon}
                        onChange={e => setEditingCat(p => ({ ...p, icon: e.target.value }))}
                        style={{ ...inputStyle, width: 60 }}
                      />
                      <input
                        value={editData.name}
                        onChange={e => setEditingCat(p => ({ ...p, name: e.target.value }))}
                        style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                      />
                      <select
                        value={editData.type}
                        onChange={e => setEditingCat(p => ({ ...p, type: e.target.value }))}
                        style={{ ...inputStyle, width: 110 }}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditingCat(p => ({ ...p, color: c }))}
                            style={{
                              width: 20, height: 20, borderRadius: '50%', background: c, border: 'none',
                              cursor: 'pointer', outline: editData.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: cat.color + '20',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18
                      }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{cat.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {cat.transaction_count} transactions · {cat.type}
                          {cat.budget_amount > 0 && ` · Budget: $${cat.budget_amount}`}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveCategory(editingCat)} style={btnPrimary}>Save</button>
                        <button onClick={() => setEditingCat(null)} style={btnSecondary}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCat({ ...cat })}
                          style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12 }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          style={{
                            padding: '6px 12px', background: 'transparent',
                            border: '1px solid #fca5a5', borderRadius: 6,
                            cursor: 'pointer', color: '#ef4444', fontSize: 12
                          }}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rules Section */}
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Auto-categorization Rules ({catRules.length})
                  </div>

                  <Droppable droppableId={`rules-${cat.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: 32,
                          background: snapshot.isDraggingOver ? '#f5f3ff' : 'transparent',
                          borderRadius: 8, padding: 4,
                          transition: 'background 0.15s'
                        }}
                      >
                        {catRules.length === 0 && !snapshot.isDraggingOver && (
                          <div style={{ fontSize: 12, color: '#d1d5db', padding: '6px 4px' }}>
                            No rules — drag rules here or add one below
                          </div>
                        )}
                        {catRules.map((rule, index) => (
                          <Draggable key={rule.id} draggableId={`rule-${rule.id}`} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 10px', marginBottom: 4,
                                  background: snap.isDragging ? '#eef2ff' : '#f9fafb',
                                  borderRadius: 6, border: '1px solid #e5e7eb',
                                  cursor: 'grab',
                                  ...prov.draggableProps.style
                                }}
                              >
                                <span style={{ color: '#d1d5db', fontSize: 14 }}>⠿</span>
                                <code style={{ fontSize: 12, color: '#6366f1', flex: 1 }}>
                                  {rule.field} {rule.match_type} "{rule.pattern}"
                                </code>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#9ca3af', fontSize: 14, padding: 2
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Rule Form */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <input
                      placeholder="Pattern (e.g. AMAZON, UBER, Starbucks)"
                      value={ruleForm.pattern}
                      onChange={e => setNewRules(p => ({
                        ...p, [cat.id]: { ...ruleForm, pattern: e.target.value }
                      }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddRule(cat.id)}
                      style={{ ...inputStyle, flex: '2 1 140px', fontSize: 12 }}
                    />
                    <select
                      value={ruleForm.match_type}
                      onChange={e => setNewRules(p => ({
                        ...p, [cat.id]: { ...ruleForm, match_type: e.target.value }
                      }))}
                      style={{ ...inputStyle, flex: '1 1 100px', fontSize: 12 }}
                    >
                      {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={ruleForm.field}
                      onChange={e => setNewRules(p => ({
                        ...p, [cat.id]: { ...ruleForm, field: e.target.value }
                      }))}
                      style={{ ...inputStyle, flex: '1 1 90px', fontSize: 12 }}
                    >
                      {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button
                      onClick={() => handleAddRule(cat.id)}
                      style={{ ...btnPrimary, fontSize: 12, padding: '8px 14px' }}
                    >
                      + Add Rule
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {categories.length === 0 && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 40,
          textAlign: 'center', color: '#9ca3af',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          No categories yet. Add one to get started!
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff'
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 };
const btnPrimary = {
  padding: '9px 16px', background: '#6366f1', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 500,
  whiteSpace: 'nowrap'
};
const btnSecondary = {
  padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151',
  whiteSpace: 'nowrap'
};
