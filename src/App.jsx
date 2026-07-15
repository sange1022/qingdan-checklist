import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'qingdan-app-state-v2'

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const uncheckedFirst = (items) => [...items].sort((left, right) => Number(left.checked) - Number(right.checked))

const isChecklistData = (value) => {
  if (!value || !Array.isArray(value.templates) || !Array.isArray(value.projects)) return false
  if (value.appName !== undefined && typeof value.appName !== 'string') return false
  const validItem = (item) => item && typeof item.id === 'string' && typeof item.text === 'string' && typeof item.checked === 'boolean'
  const validList = (list) => list && typeof list.id === 'string' && typeof list.name === 'string' && Array.isArray(list.items) && list.items.every(validItem)
  return value.templates.every(validList) && value.projects.every((project) => (
    project && typeof project.id === 'string' && typeof project.name === 'string' && Array.isArray(project.lists) && project.lists.every(validList)
  ))
}

const starterState = {
  appName: '清单',
  templates: [
    {
      id: 'tpl-daily',
      name: '出门随身物品',
      items: [
        { id: 'i-key', text: '钥匙', checked: true },
        { id: 'i-phone', text: '手机', checked: false },
        { id: 'i-wallet', text: '钱包', checked: false },
        { id: 'i-earbuds', text: '耳机', checked: false },
        { id: 'i-power', text: '充电宝', checked: false },
      ],
    },
    {
      id: 'tpl-trip',
      name: '短途旅行',
      items: [
        { id: 'i-id', text: '身份证', checked: false },
        { id: 'i-clothes', text: '换洗衣物', checked: false },
        { id: 'i-charger', text: '充电器', checked: false },
      ],
    },
    {
      id: 'tpl-work',
      name: '每周工作检查',
      items: [
        { id: 'i-mail', text: '清理未读邮件', checked: false },
        { id: 'i-weekly', text: '整理本周记录', checked: false },
        { id: 'i-next', text: '确认下周安排', checked: false },
      ],
    },
  ],
  projects: [
    {
      id: 'prj-hangzhou',
      name: '周末去杭州',
      lists: [
        {
          id: 'list-daily',
          templateId: 'tpl-daily',
          name: '出门随身物品',
          items: [
            { id: 'p-key', text: '钥匙', checked: true },
            { id: 'p-phone', text: '手机', checked: true },
            { id: 'p-wallet', text: '钱包', checked: false },
            { id: 'p-earbuds', text: '耳机', checked: false },
            { id: 'p-power', text: '充电宝', checked: false },
          ],
        },
        {
          id: 'list-trip',
          templateId: 'tpl-trip',
          name: '短途旅行',
          items: [
            { id: 'p-id', text: '身份证', checked: true },
            { id: 'p-clothes', text: '换洗衣物', checked: false },
            { id: 'p-charger', text: '充电器', checked: false },
          ],
        },
        {
          id: 'list-work',
          templateId: 'tpl-work',
          name: '每周工作检查',
          items: [
            { id: 'p-mail', text: '清理未读邮件', checked: true },
            { id: 'p-weekly', text: '整理本周记录', checked: false },
            { id: 'p-next', text: '确认下周安排', checked: false },
          ],
        },
      ],
    },
    { id: 'prj-business', name: '出差准备', lists: [] },
    { id: 'prj-moving', name: '搬家检查', lists: [] },
  ],
}

function Icon({ name, size = 18 }) {
  const paths = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m7 7 10 10M17 7 7 17" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></>,
    chevron: <><path d="m8 10 4 4 4-4" /></>,
    check: <><path d="m7.5 12 3 3 6-7" /></>,
    template: <><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" /></>,
    transfer: <><path d="M8 7h10m0 0-3-3m3 3-3 3M16 17H6m0 0 3 3m-3-3 3-3" /></>,
    download: <><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" /></>,
    upload: <><path d="M12 20V9m0 0 4 4m-4-4-4 4M5 4h14" /></>,
  }
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</g>
    </svg>
  )
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function NameForm({ label, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  return (
    <form className="name-form" onSubmit={(event) => {
      event.preventDefault()
      const nextName = name.trim()
      if (nextName) onSubmit(nextName)
    }}>
      <label htmlFor="name-input">{label}</label>
      <input id="name-input" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="输入名称" />
      <div className="form-actions">
        <button className="button button-quiet" type="button" onClick={onCancel}>取消</button>
        <button className="button button-dark" type="submit" disabled={!name.trim()}>{submitLabel}</button>
      </div>
    </form>
  )
}

function CheckRow({ item, onToggle, onDelete }) {
  return (
    <div className={`check-row ${item.checked ? 'is-checked' : ''}`}>
      <button className="check-target" type="button" aria-label={item.checked ? `标记“${item.text}”为未检查` : `标记“${item.text}”为已检查`} aria-pressed={item.checked} onClick={onToggle}>
        {item.checked ? <Icon name="check" size={17} /> : null}
      </button>
      <button className="check-text" type="button" onClick={onToggle}>{item.text}</button>
      <button className="row-delete" type="button" onClick={onDelete} aria-label={`删除“${item.text}”`}><Icon name="trash" size={16} /></button>
    </div>
  )
}

function AddRow({ onAdd, placeholder = '添加一项' }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const commit = () => {
    const text = value.trim()
    if (text) onAdd(text)
    setValue('')
    setEditing(false)
  }

  if (!editing) {
    return <button className="add-row" type="button" onClick={() => setEditing(true)}><Icon name="plus" />{placeholder}</button>
  }

  return (
    <form className="add-row add-row-form" onSubmit={(event) => { event.preventDefault(); commit() }}>
      <Icon name="plus" />
      <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onBlur={commit} placeholder="输入内容，按回车添加" aria-label="新清单内容" />
    </form>
  )
}

function EditableTitle({ value, onSave, level = 1, className = '', activateOnClick = false, label = '编辑名称' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const Heading = `h${level}`

  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const next = draft.trim()
    if (next && next !== value) onSave(next)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return <input className={`title-input title-${level} ${className}`} autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => {
      if (event.key === 'Enter') commit()
      if (event.key === 'Escape') { setDraft(value); setEditing(false) }
    }} aria-label={label} />
  }

  return (
    <Heading
      className={`editable-title title-${level} ${className}`}
      onClick={activateOnClick ? () => setEditing(true) : undefined}
      onDoubleClick={!activateOnClick ? () => setEditing(true) : undefined}
      title={activateOnClick ? '点击重命名' : '双击重命名'}
    >{value}</Heading>
  )
}

function TemplateRail({ templates, selectedId, onSelect, onCreate }) {
  return (
    <aside className="template-rail">
      <div className="section-heading rail-heading">
        <h2>模板</h2>
        <button className="text-button" type="button" onClick={onCreate}><Icon name="plus" />新建模板</button>
      </div>
      <nav className="template-nav" aria-label="模板清单">
        {templates.map((template) => (
          <button className={`template-link ${selectedId === template.id ? 'is-active' : ''}`} type="button" key={template.id} onClick={() => onSelect(template.id)}>
            <span>{template.name}</span>
            <small>{template.items.length} 项</small>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function ProjectRail({ projects, selectedId, onSelect, onCreate }) {
  return (
    <aside className="project-rail">
      <div className="section-heading"><h2>项目</h2></div>
      <nav className="project-nav" aria-label="项目列表">
        {projects.map((project) => {
          const total = project.lists.reduce((sum, list) => sum + list.items.length, 0)
          const checked = project.lists.reduce((sum, list) => sum + list.items.filter((item) => item.checked).length, 0)
          return (
            <button className={`project-link ${selectedId === project.id ? 'is-active' : ''}`} type="button" key={project.id} onClick={() => onSelect(project.id)}>
              <span>{project.name}</span>
              <small>{total ? `${checked}/${total}` : '空'}</small>
            </button>
          )
        })}
      </nav>
      <button className="button button-outline rail-create" type="button" onClick={onCreate}><Icon name="plus" />新建项目</button>
    </aside>
  )
}

function TemplateEditor({ template, onRename, onToggle, onAdd, onDeleteItem, onDeleteTemplate }) {
  if (!template) return <main className="template-editor empty-region">先新建一个模板</main>
  return (
    <main className="template-editor">
      <div className="panel-title-row">
        <EditableTitle value={template.name} onSave={onRename} />
        <button className="icon-button destructive" type="button" onClick={onDeleteTemplate} aria-label="删除当前模板" title="删除模板"><Icon name="trash" /></button>
      </div>
      <div className="checklist" aria-label={`${template.name}的内容`}>
        {uncheckedFirst(template.items).map((item) => (
          <CheckRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onDelete={() => onDeleteItem(item.id)} />
        ))}
        <AddRow onAdd={onAdd} />
      </div>
    </main>
  )
}

function TemplateManager({ open, onClose, templates, selectedId, onSelect, onCreate, editorProps }) {
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="template-drawer" role="dialog" aria-modal="true" aria-label="管理模板">
        <header className="drawer-header">
          <h2>管理模板</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭模板管理"><Icon name="close" /></button>
        </header>
        <div className="template-manager-grid">
          <TemplateRail templates={templates} selectedId={selectedId} onSelect={onSelect} onCreate={onCreate} />
          <TemplateEditor {...editorProps} />
        </div>
      </aside>
    </div>
  )
}

function ProjectWorkspace({ project, templates, onDeleteProject, onRenameProject, onRename, onAttach, onToggle, onAddItem, onDeleteItem, onDeleteList }) {
  const [itemFilter, setItemFilter] = useState('open')
  return (
    <section className="project-workspace">
      <div className="project-topline">
        <div className="project-selector-wrap">
          {project ? (
            <div className="project-title-controls">
              <EditableTitle value={project.name} onSave={onRenameProject} className="project-title" activateOnClick label="编辑项目名称" />
              <button className="icon-button destructive project-delete" type="button" onClick={onDeleteProject} aria-label="删除当前项目" title="删除项目"><Icon name="trash" /></button>
            </div>
          ) : <h1 className="project-empty-title">还没有项目</h1>}
        </div>
        {project ? <button className="button button-outline" type="button" onClick={onAttach} disabled={!templates.length}><Icon name="template" />添加清单</button> : null}
      </div>

      {project ? (
        <>
          <div className="project-actions">
            <span>{project.lists.length ? `${project.lists.length} 个清单` : '这个项目还没有清单'}</span>
            <div className="filter-switch" role="group" aria-label="清单显示范围">
              <button type="button" aria-pressed={itemFilter === 'open'} className={itemFilter === 'open' ? 'is-active' : ''} onClick={() => setItemFilter('open')}>未检查</button>
              <button type="button" aria-pressed={itemFilter === 'all'} className={itemFilter === 'all' ? 'is-active' : ''} onClick={() => setItemFilter('all')}>全部</button>
            </div>
          </div>
          <div className="project-lists">
            {project.lists.map((list) => {
              const checked = list.items.filter((item) => item.checked).length
              const visibleItems = uncheckedFirst(list.items).filter((item) => itemFilter === 'all' || !item.checked)
              return (
                <article className="project-list" key={list.id}>
                  <header className="list-heading">
                    <div>
                      <EditableTitle value={list.name} onSave={(name) => onRename(list.id, name)} level={2} />
                      <p>{checked} / {list.items.length} 已检查</p>
                    </div>
                    <button className="icon-button destructive" type="button" onClick={() => onDeleteList(list.id)} aria-label={`移除“${list.name}”`} title="从项目移除"><Icon name="trash" /></button>
                  </header>
                  <div className="progress" aria-hidden="true"><span style={{ width: `${list.items.length ? (checked / list.items.length) * 100 : 0}%` }} /></div>
                  <div className="checklist compact">
                    {visibleItems.map((item) => <CheckRow key={item.id} item={item} onToggle={() => onToggle(list.id, item.id)} onDelete={() => onDeleteItem(list.id, item.id)} />)}
                    {!visibleItems.length ? <p className="filtered-empty">已全部检查</p> : null}
                    <AddRow onAdd={(text) => onAddItem(list.id, text)} />
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="project-empty"><p>新建一个项目，然后添加需要检查的模板清单。</p></div>
      )}
    </section>
  )
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : starterState
    } catch {
      return starterState
    }
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => data.templates[0]?.id ?? '')
  const [selectedProjectId, setSelectedProjectId] = useState(() => data.projects[0]?.id ?? '')
  const [modal, setModal] = useState(null)
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false)
  const [transferStatus, setTransferStatus] = useState('')
  const [exportUrl, setExportUrl] = useState('')
  const importInputRef = useRef(null)

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data])
  const appName = data.appName?.trim() || '清单'
  useEffect(() => { document.title = appName }, [appName])
  useEffect(() => {
    const payload = { app: '清单', version: 1, exportedAt: new Date().toISOString(), data }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }))
    setExportUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [data])

  const selectedTemplate = useMemo(
    () => data.templates.find((template) => template.id === selectedTemplateId) ?? data.templates[0],
    [data.templates, selectedTemplateId],
  )
  const selectedProject = useMemo(
    () => data.projects.find((project) => project.id === selectedProjectId) ?? data.projects[0],
    [data.projects, selectedProjectId],
  )

  const updateTemplate = (recipe) => setData((current) => ({
    ...current,
    templates: current.templates.map((template) => template.id === selectedTemplate?.id ? recipe(template) : template),
  }))

  const updateProject = (recipe) => setData((current) => ({
    ...current,
    projects: current.projects.map((project) => project.id === selectedProjectId ? recipe(project) : project),
  }))

  const createTemplate = (name) => {
    const next = { id: uid(), name, items: [] }
    setData((current) => ({ ...current, templates: [...current.templates, next] }))
    setSelectedTemplateId(next.id)
    setModal(null)
  }

  const createProject = (name) => {
    const next = { id: uid(), name, lists: [] }
    setData((current) => ({ ...current, projects: [...current.projects, next] }))
    setSelectedProjectId(next.id)
    setModal(null)
  }

  const deleteTemplate = () => {
    if (!selectedTemplate || !window.confirm(`确定删除模板“${selectedTemplate.name}”吗？项目中已经添加的清单会保留。`)) return
    const remaining = data.templates.filter((template) => template.id !== selectedTemplate.id)
    setData((current) => ({ ...current, templates: remaining }))
    setSelectedTemplateId(remaining[0]?.id ?? '')
  }

  const attachTemplate = (templateId) => {
    const template = data.templates.find((item) => item.id === templateId)
    if (!template) return
    const list = {
      id: uid(),
      templateId: template.id,
      name: template.name,
      items: template.items.map((item) => ({ id: uid(), text: item.text, checked: false })),
    }
    updateProject((project) => ({ ...project, lists: [...project.lists, list] }))
    setModal(null)
  }

  const deleteProject = () => {
    const project = data.projects.find((item) => item.id === selectedProjectId)
    if (!project || !window.confirm(`确定删除项目“${project.name}”吗？`)) return
    const remaining = data.projects.filter((item) => item.id !== project.id)
    setData((current) => ({ ...current, projects: remaining }))
    setSelectedProjectId(remaining[0]?.id ?? '')
  }

  const renameProject = (name) => setData((current) => ({
    ...current,
    projects: current.projects.map((project) => project.id === selectedProjectId ? { ...project, name } : project),
  }))

  const importData = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const nextData = parsed?.data ?? parsed
      if (!isChecklistData(nextData)) throw new Error('invalid-data')
      if (!window.confirm('导入会替换当前电脑上的全部清单数据，确定继续吗？')) return
      setData(nextData)
      setSelectedTemplateId(nextData.templates[0]?.id ?? '')
      setSelectedProjectId(nextData.projects[0]?.id ?? '')
      setTransferStatus(`已导入“${file.name}”，数据已保存到本机。`)
    } catch {
      setTransferStatus('导入失败：请选择由本应用导出的 JSON 备份文件。')
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <EditableTitle
            value={appName}
            onSave={(name) => setData((current) => ({ ...current, appName: name }))}
            className="brand-editable"
            activateOnClick
            label="编辑左上角名称"
          />
        </div>
        <div className="header-actions">
          <button className="button button-outline" type="button" onClick={() => setTemplateManagerOpen(true)}><Icon name="template" />管理模板</button>
          <button className="button button-outline" type="button" onClick={() => { setTransferStatus(''); setModal('transfer') }}><Icon name="transfer" />导入/导出</button>
          <button className="button button-dark" type="button" onClick={() => setModal('project')}><Icon name="plus" />新建项目</button>
        </div>
      </header>
      <div className="workspace">
        <ProjectRail projects={data.projects} selectedId={selectedProject?.id} onSelect={setSelectedProjectId} onCreate={() => setModal('project')} />
        <ProjectWorkspace
          project={selectedProject}
          templates={data.templates}
          onDeleteProject={deleteProject}
          onRenameProject={renameProject}
          onRename={(listId, name) => updateProject((project) => ({ ...project, lists: project.lists.map((list) => list.id === listId ? { ...list, name } : list) }))}
          onAttach={() => setModal('attach')}
          onToggle={(listId, itemId) => updateProject((project) => ({ ...project, lists: project.lists.map((list) => list.id === listId ? { ...list, items: list.items.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item) } : list) }))}
          onAddItem={(listId, text) => updateProject((project) => ({ ...project, lists: project.lists.map((list) => list.id === listId ? { ...list, items: [...list.items, { id: uid(), text, checked: false }] } : list) }))}
          onDeleteItem={(listId, itemId) => updateProject((project) => ({ ...project, lists: project.lists.map((list) => list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list) }))}
          onDeleteList={(listId) => updateProject((project) => ({ ...project, lists: project.lists.filter((list) => list.id !== listId) }))}
        />
      </div>

      <TemplateManager
        open={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        templates={data.templates}
        selectedId={selectedTemplate?.id}
        onSelect={setSelectedTemplateId}
        onCreate={() => setModal('template')}
        editorProps={{
          template: selectedTemplate,
          onRename: (name) => updateTemplate((template) => ({ ...template, name })),
          onToggle: (itemId) => updateTemplate((template) => ({ ...template, items: template.items.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item) })),
          onAdd: (text) => updateTemplate((template) => ({ ...template, items: [...template.items, { id: uid(), text, checked: false }] })),
          onDeleteItem: (itemId) => updateTemplate((template) => ({ ...template, items: template.items.filter((item) => item.id !== itemId) })),
          onDeleteTemplate: deleteTemplate,
        }}
      />

      {modal === 'template' ? <Modal title="新建模板" onClose={() => setModal(null)}><NameForm label="模板名称" submitLabel="创建模板" onSubmit={createTemplate} onCancel={() => setModal(null)} /></Modal> : null}
      {modal === 'project' ? <Modal title="新建项目" onClose={() => setModal(null)}><NameForm label="项目名称" submitLabel="创建项目" onSubmit={createProject} onCancel={() => setModal(null)} /></Modal> : null}
      {modal === 'transfer' ? (
        <Modal title="导入与导出" onClose={() => setModal(null)}>
          <div className="transfer-panel">
            <p className="transfer-intro">通过备份文件，把模板、项目和全部检查状态带到另一台电脑。</p>
            <section className="transfer-option">
              <div><h3>导出本机数据</h3><p>下载一个 JSON 备份文件，不会改变当前内容。</p></div>
              <a
                className="button button-dark"
                href={exportUrl}
                download={`清单备份-${new Date().toISOString().slice(0, 10)}.json`}
                onClick={() => setTransferStatus('备份文件已导出，可复制到其他电脑导入。')}
              ><Icon name="download" />导出备份</a>
            </section>
            <section className="transfer-option">
              <div><h3>导入备份文件</h3><p>导入后会替换这台电脑当前保存的全部内容。</p></div>
              <button className="button button-outline" type="button" onClick={() => importInputRef.current?.click()}><Icon name="upload" />选择文件</button>
              <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} />
            </section>
            {transferStatus ? <p className={`transfer-status ${transferStatus.startsWith('导入失败') ? 'is-error' : ''}`} role="status">{transferStatus}</p> : null}
          </div>
        </Modal>
      ) : null}
      {modal === 'attach' ? (
        <Modal title="添加模板清单" onClose={() => setModal(null)}>
          <div className="template-picker">
            <p>添加后会生成独立副本，不会改变原模板。</p>
            {data.templates.map((template) => (
              <button type="button" key={template.id} onClick={() => attachTemplate(template.id)}>
                <span>{template.name}</span><small>{template.items.length} 项</small>
              </button>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
