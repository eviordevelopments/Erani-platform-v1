import { supabase } from './supabaseClient';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PROJECT_CREATE' 
  | 'PROJECT_UPDATE'
  | 'PROJECT_DUPLICATE'
  | 'PROJECT_RENAME'
  | 'PROJECT_DELETE'
  | 'REPORT_GENERATE' 
  | 'REPORT_DOWNLOAD'
  | 'FILE_UPLOAD'
  | 'FILE_DELETE'
  | 'CONFIG_CHANGE'
  | 'FEATURE_TOGGLE'
  | 'TEAM_INVITE'
  | 'TEAM_REMOVE'
  | 'NAVIGATE'
  | 'AUDIT_START'
  | 'AUDIT_COMPLETE'
  | 'FORENSIC_RETRY'
  | 'SESSION_TIMEOUT'
  | 'EXPORT';

export type IconType = 
  | 'user' 
  | 'log-in' 
  | 'log-out' 
  | 'plus' 
  | 'copy'
  | 'trash' 
  | 'trash-2'
  | 'update'
  | 'file-text' 
  | 'download' 
  | 'upload' 
  | 'upload-cloud'
  | 'settings' 
  | 'users' 
  | 'navigation' 
  | 'play' 
  | 'check-circle'
  | 'rotate-ccw'
  | 'shield'
  | 'zap'
  | 'activity';

/**
 * Utility to record platform activity.
 * Respects the 'streaming_logs_enabled' setting from organization_features.
 */
let sessionPromise: Promise<any> | null = null;

export const auditLogger = {
  async log(
    action: AuditAction,
    description: string,
    metadata: any = {},
    iconType: IconType = 'activity'
  ) {
    try {
      // 1. Get current session (deduplicating concurrent calls to avoid token lock stealing)
      if (!sessionPromise) {
        sessionPromise = supabase.auth.getSession();
        sessionPromise.catch(() => {}).finally(() => { sessionPromise = null; });
      }
      const { data: { session } } = await sessionPromise;
      if (!session) return;

      const userId = session.user.id;
      
      // 2. Get profile to find organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();
      
      if (!profile?.organization_id) return;

      const orgId = profile.organization_id;

      // 3. Check if logging is enabled for this org
      const { data: features } = await supabase
        .from('organization_features')
        .select('streaming_logs_enabled')
        .eq('organization_id', orgId)
        .single();

      // If logging is explicitly disabled, skip
      if (features && features.streaming_logs_enabled === false) {
        console.log(`[AuditLogger] Logging suppressed for action: ${action}`);
        return;
      }

      // 4. Insert log
      let { error } = await supabase
        .from('audit_logs')
        .insert({
          organization_id: orgId,
          user_id: userId,
          action,
          description,
          metadata,
          icon_type: iconType
        });

      // Fallback if the column icon_type doesn't exist in the database yet
      if (error && (error.message.includes('icon_type') || error.code === '42703')) {
        const { error: fallbackError } = await supabase
          .from('audit_logs')
          .insert({
            organization_id: orgId,
            user_id: userId,
            action,
            description,
            metadata
          });
        error = fallbackError;
      }

      if (error) {
        console.error('[AuditLogger] Error inserting log:', error.message);
      }
    } catch (err) {
      console.error('[AuditLogger] Unexpected error:', err);
    }
  }
};
