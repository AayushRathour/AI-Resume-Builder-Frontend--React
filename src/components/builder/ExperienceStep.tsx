import useResumeStore from '../../store/useResumeStore'
import { Plus, Trash2, Briefcase, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

export default function ExperienceStep() {
  const experience = useResumeStore((s) => s.data.experience)
  const addExperience = useResumeStore((s) => s.addExperience)
  const updateExperience = useResumeStore((s) => s.updateExperience)
  const removeExperience = useResumeStore((s) => s.removeExperience)
  const reorderExperience = useResumeStore((s) => s.reorderExperience)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    reorderExperience(result.source.index, result.destination.index)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Work Experience</h2>
          <p className="text-sm text-slate-500">Add your work history, starting with the most recent position.</p>
        </div>
        <button onClick={addExperience} className="btn-primary px-3 py-2 flex items-center gap-1.5 text-sm shrink-0">
          <Plus size={16} /> Add
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Briefcase size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No work experience added yet.</p>
          <button onClick={addExperience} className="text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
            + Add your first experience
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="experience-list">
            {(provided) => (
              <div 
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {experience.map((exp, idx) => (
                  <Draggable key={exp.id} draggableId={exp.id} index={idx}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`card border border-slate-200 rounded-xl overflow-hidden transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
                      >
                        {/* Collapsible header */}
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggle(exp.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps} 
                              className="p-1 text-slate-400 hover:text-slate-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </div>
                            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{exp.position || 'New Position'}</p>
                              <p className="text-xs text-slate-500">{exp.company || 'Company'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeExperience(exp.id) }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            {collapsed[exp.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Form fields */}
                        {!collapsed[exp.id] && (
                          <div className="p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Position / Role</label>
                                <input
                                  value={exp.position}
                                  onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Senior Software Engineer"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Company</label>
                                <input
                                  value={exp.company}
                                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Google"
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                                <input
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Jan 2022"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                                <input
                                  value={exp.endDate}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. Dec 2024"
                                  disabled={exp.current}
                                />
                              </div>
                              <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={exp.current}
                                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                    className="w-4 h-4 accent-primary-500"
                                  />
                                  <span className="text-slate-600">Currently working here</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description / Key Achievements</label>
                              <textarea
                                value={exp.description}
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                className="input-field text-sm min-h-[100px] resize-y"
                                placeholder="• Led a team of 5 engineers to deliver...&#10;• Increased system performance by 40%...&#10;• Implemented CI/CD pipeline reducing deploy time..."
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
