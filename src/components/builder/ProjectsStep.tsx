import useResumeStore from '../../store/useResumeStore'
import { Plus, Trash2, FolderOpen, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import AiButton from './AiButton'
import { aiApi } from '../../api/aiApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function ProjectsStep() {
  const projects = useResumeStore((s) => s.data.projects)
  const addProject = useResumeStore((s) => s.addProject)
  const updateProject = useResumeStore((s) => s.updateProject)
  const removeProject = useResumeStore((s) => s.removeProject)
  const reorderProject = useResumeStore((s) => s.reorderProject)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const { user } = useAuth()

  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    reorderProject(result.source.index, result.destination.index)
  }

  const handleImproveProject = async (id: string) => {
    if (!user) {
      toast.error('Please log in to use AI features')
      return
    }
    const proj = projects.find(p => p.id === id)
    if (!proj || !proj.description.trim()) {
      toast.error('Write some description first, then improve it')
      return
    }

    const result = await aiApi.improveSection(user.userId, 'free', 'project', proj.description)
    if (result && result !== proj.description && result !== 'AI TEMPORARILY UNAVAILABLE') {
      updateProject(id, 'description', result)
      toast.success('Description improved!')
    } else {
      throw new Error('AI could not improve the description.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Projects</h2>
          <p className="text-sm text-slate-500">Showcase your best personal, academic, or professional projects.</p>
        </div>
        <button onClick={addProject} className="btn-primary px-3 py-2 flex items-center gap-1.5 text-sm shrink-0">
          <Plus size={16} /> Add
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <FolderOpen size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No projects added yet.</p>
          <button onClick={addProject} className="text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
            + Add your first project
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="projects-list">
            {(provided) => (
              <div 
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {projects.map((proj, idx) => (
                  <Draggable key={proj.id} draggableId={proj.id} index={idx}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`card border border-slate-200 rounded-xl overflow-hidden transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
                      >
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggle(proj.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps} 
                              className="p-1 text-slate-400 hover:text-slate-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </div>
                            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{proj.name || 'New Project'}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">{proj.technologies || 'Technologies'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeProject(proj.id) }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            {collapsed[proj.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {!collapsed[proj.id] && (
                          <div className="p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Project Name</label>
                                <input
                                  value={proj.name}
                                  onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. AI Resume Builder"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Link (Optional)</label>
                                <input
                                  value={proj.link}
                                  onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                                  className="input-field text-sm"
                                  placeholder="e.g. https://github.com/user/project"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Technologies Used</label>
                              <input
                                value={proj.technologies}
                                onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                                className="input-field text-sm"
                                placeholder="e.g. React, Spring Boot, MySQL, Docker"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-medium text-slate-600">Description</label>
                                <AiButton label="Improve" onClick={() => handleImproveProject(proj.id)} disabled={!proj.description.trim()} />
                              </div>
                              <textarea
                                value={proj.description}
                                onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                className="input-field text-sm min-h-[100px] resize-y"
                                placeholder="• Built a full-stack web app for...&#10;• Implemented microservices architecture...&#10;• Achieved 95% test coverage..."
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
