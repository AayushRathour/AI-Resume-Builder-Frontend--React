/**
 * Default resume template — clean single-column design.
 * Used when no template is selected or as a fallback.
 * Uses {{placeholder}} syntax compatible with the template engine.
 */
export const DEFAULT_TEMPLATE_HTML = `
<div style="font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px 48px;color:#1e293b;line-height:1.5;">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #4f46e5;padding-bottom:20px;">
    <h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b;letter-spacing:-0.5px;">{{name}}</h1>
    <p style="margin:6px 0 0;font-size:15px;color:#4f46e5;font-weight:500;">{{title}}</p>
    <div style="margin-top:10px;font-size:13px;color:#64748b;display:flex;justify-content:center;flex-wrap:wrap;gap:8px 16px;">
      <span>{{email}}</span>
      <span>{{phone}}</span>
      <span>{{location}}</span>
      <span>{{linkedin}}</span>
      <span>{{github}}</span>
      <span>{{website}}</span>
    </div>
  </div>

  <!-- Summary -->
  <div style="margin-bottom:22px;">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Professional Summary</h2>
    <p style="margin:0;font-size:13px;color:#334155;white-space:pre-line;">{{summary}}</p>
  </div>

  <!-- Skills -->
  <div style="margin-bottom:22px;">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Skills</h2>
    {{skills}}
  </div>

  <!-- Experience -->
  <div style="margin-bottom:22px;">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Work Experience</h2>
    {{experience}}
  </div>

  <!-- Education -->
  <div style="margin-bottom:22px;">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Education</h2>
    {{education}}
  </div>

  <!-- Projects -->
  <div style="margin-bottom:22px;">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Projects</h2>
    {{projects}}
  </div>
</div>
`

export const DEFAULT_TEMPLATE_NAME = 'Clean Professional (Default)'

export const DEFAULT_EMPTY_TEMPLATE_HTML = `
<div style="font-family:Arial,sans-serif;padding:40px;">
  <h1>{{name}}</h1>
  <p>{{title}}</p>
  <p>{{summary}}</p>
  {{skills}}
  {{experience}}
  {{education}}
  {{projects}}
</div>
`
