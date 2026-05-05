import { supabase } from './supabaseClient';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PROJECT_CREATE' 
  | 'PROJECT_DELETE'
  | 'REPORT_GENERATE' 
  | 'REPORT_DOWNLOAD'
  | 'FILE_UPLOAD'
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
  | 'trash' 
  | 'file-text' 
  | 'download' 
  | 'upload' 
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
export const auditLogger = {
  async log(
    action: AuditAction,
    description: string,
    metadata: any = {},
    iconType: IconType = 'activity'
  ) {
    try {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
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
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          organization_id: orgId,
          user_id: userId,
          action,
          description,
          metadata,
          icon_type: iconType
        });

      if (error) {
        console.error('[AuditLogger] Error inserting log:', error.message);
      }
    } catch (err) {
      console.error('[AuditLogger] Unexpected error:', err);
    }
  }
};
