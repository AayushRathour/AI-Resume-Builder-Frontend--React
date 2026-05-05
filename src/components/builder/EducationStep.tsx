import useResumeStore from '../../store/useResumeStore'
import { Plus, Trash2, GraduationCap, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

export default function EducationStep() {
  const education = useResumeStore((s) => s.data.education)
  const addEducation = useResumeStore((s) => s.addEducation)
  const updateEducation = useResumeStore((s) => s.updateEducation)
  const removeEducation = useResumeStore((s) => s.removeEducation)
  const reorderEducation = useResumeStore((s) => s.reorderEducation)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    reorderEducation(result.source.index, result.destination.index)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Education</h2>
          <p className="text-sm text-slate-500">Add your educational background, starting with the most recent.</p>
        </div>
        <button onClick={addEducation} className="btn-primary px-3 py-2 flex items-center gap-1.5 text-sm shrink-0">
          <Plus size={16} /> Add
        </button>
      </div>

      {education.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <GraduationCap size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No education added yet.</p>
          <button onClick={addEducation} className="text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
            + Add your first education
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="education-list">
            {(provided) => (
              <div 
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {education.map((edu, idx) => (
                  <Draggable key={edu.id} draggableId={edu.id} index={idx}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`card border border-slate-200 rounded-xl overflow-hidden transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggle(edu.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps} 
                              className="p-1 text-slate-400 hover:text-slate-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </div>
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{edu.degree || 'New Degree'}{edu.field ? ` in ${edu.field}` : ''}</p>
                              <p className="text-xs text-slate-500">{edu.institution || 'Institution'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeEducation(edu.id) }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            {collapsed[edu.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {!collapsed[edu.id] && (
                          <div className="p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Institution</label>
                                <input
                                  value={edu.institution}
                                  onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. IIT Delhi"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Degree</label>
                                <input
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. B.Tech"
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Field of Study</label>
                                <input
                                  value={edu.field}
                                  onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Computer Science"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                                <input
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Aug 2020"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                                <input
                                  value={edu.endDate}
                                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. May 2024"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description / Achievements</label>
                              <textarea
                                value={edu.description}
                                onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                                className="input-field text-sm min-h-[80px] resize-y"
                                placeholder="e.g. CGPA: 8.5/10, Dean's List, relevant coursework..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}
