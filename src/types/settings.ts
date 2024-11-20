export interface SettingsComponent {
    submit: () => Promise<void>
    reset: () => void
  }
  
  export type SettingsTab = {
    id: string
    name: string
    icon: any // Or use a more specific type for your icons
    component: any // Will be refined in the component
  }