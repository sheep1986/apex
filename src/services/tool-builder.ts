import { SupabaseClient } from '@supabase/supabase-js';

// Types representing the internal DB structure for Tools
export interface VoiceToolDB {
  id: string;
  name: string;
  description?: string;
  type: 'function' | 'dtmf' | 'endCall' | 'transferCall';
  schema: Record<string, any>; // JSON Schema
  config?: {
    serverUrl?: string;
    headers?: Record<string, string>;
    [key: string]: any; // Allow extensibility
  };
  provider_metadata?: Record<string, any>;
  is_active: boolean;
}

// Types representing the Provider (Vapi) Tool Schema
// Abstracted to be as generic as possible while matching Vapi expectations
export interface ProviderTool {
  type: string;
  function?: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
  server?: {
    url: string;
    secret?: string;
  };
  messages?: any[]; // For DTMF/transfer messages
  [key: string]: any;
}

export class ToolBuilder {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Builds the full list of provider-formatted tools for an assistant.
   * 1. Fetches tools linked to the assistant from DB.
   * 2. Transforms them into Reference-Agnostic Provider definitions.
   * 3. Aggregates tool-specific knowledge files if applicable.
   */
  async buildToolsForAssistant(assistantId: string, orgConfig?: { universalRouterUrl?: string }): Promise<ProviderTool[]> {
    // 1. Fetch Linked Tools
    const { data: linkedTools, error } = await this.supabase
      .from('assistant_tools')
      .select(`
        tool:voice_tools (
          id, name, description, type, schema, config
        )
      `)
      .eq('assistant_id', assistantId);

    if (error) {
      console.error('Failed to fetch assistant tools:', error);
      throw new Error(`ToolBuilder fetch error: ${error.message}`);
    }

    if (!linkedTools || linkedTools.length === 0) {
      return [];
    }

    // 2. Transform to Provider Schema
    const providerTools: ProviderTool[] = linkedTools.map((link: any) => {
      const tool = link.tool as VoiceToolDB;
      return this.transformToProviderFormat(tool, orgConfig);
    });

    return providerTools;
  }

  /**
   * Resolves a list of Tool IDs into Provider-formatted tools.
   * Used when creating a new assistant (before DB links exist).
   */
  async resolveTools(toolIds: string[], orgConfig?: { universalRouterUrl?: string }): Promise<ProviderTool[]> {
      if (!toolIds || toolIds.length === 0) return [];

      const { data: tools, error } = await this.supabase
          .from('voice_tools')
          .select('id, name, description, type, schema, config')
          .in('id', toolIds);

      if (error) {
          console.error('Failed to fetch tools by IDs:', error);
          throw new Error(`ToolBuilder fetch error: ${error.message}`);
      }

      return (tools || []).map((tool: any) => 
          this.transformToProviderFormat(tool, orgConfig)
      );
  }

  /**
   * Transforms a single internal tool definition into the provider format.
   * Handles type mapping (function vs dtmf) and server URL resolution.
   */
  private transformToProviderFormat(tool: VoiceToolDB, orgConfig?: { universalRouterUrl?: string }): ProviderTool {
    const universalUrl = orgConfig?.universalRouterUrl || `${window.location.origin}/api/vapi-router`; // Fallback if window exists, else needs env
    
    // Base Tool Construction
    if (tool.type === 'function') {
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema,
        },
        server: {
          url: tool.config?.serverUrl || universalUrl,
        },
        async: false, // Default to synchronous calling for now
      };
    }

    // DTMF Tool Construction
    if (tool.type === 'dtmf') {
      return {
        type: 'dtmf',
        // Mapping typical DTMF schemas if stored in JSON
        ...tool.schema, 
      };
    }
    
    // Fallback pass-through for other types
    return {
      type: tool.type,
      ...tool.schema,
    };
  }
}
