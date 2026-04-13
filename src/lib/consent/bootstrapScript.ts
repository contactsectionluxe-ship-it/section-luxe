import { CONSENT_POLICY_VERSION, CONSENT_STORAGE_KEY } from './constants';

/**
 * Script inline exécuté avant GTM : défaut refus + relecture synchrone du localStorage
 * pour éviter une fenêtre où les tags partent en « denied » alors que l’utilisateur avait déjà accepté.
 */
export function getConsentBootstrapInlineScript(): string {
  const key = JSON.stringify(CONSENT_STORAGE_KEY);
  const policy = CONSENT_POLICY_VERSION;
  return `(function(){
var K=${key};
var POLICY=${policy};
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
ad_storage:'denied',
ad_user_data:'denied',
ad_personalization:'denied',
analytics_storage:'denied',
functionality_storage:'granted',
personalization_storage:'denied',
security_storage:'granted',
wait_for_update:500
});
try{
var raw=localStorage.getItem(K);
if(!raw)return;
var o=JSON.parse(raw);
if(o.v!==1||o.policyVersion!==POLICY||!o.updatedAt)return;
gtag('consent','update',{
analytics_storage:o.analytics?'granted':'denied',
ad_storage:o.marketing?'granted':'denied',
ad_user_data:o.marketing?'granted':'denied',
ad_personalization:o.marketing?'granted':'denied',
personalization_storage:o.marketing?'granted':'denied'
});
}catch(e){}
})();`;
}
