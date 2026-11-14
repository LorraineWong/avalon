/* Attestation starts after initializeApp and before any Firebase service access.
 * No debug provider, bypass token or paid-service fallback is shipped. */
window.AvalonAppCheck = (() => {
  let activated=false;
  function activate(sdk){
    if(activated)return true;
    const config=window.AvalonAppCheckConfig;
    if(!config?.siteKey || !config.allowedHosts.includes(location.hostname))return false;
    if(typeof sdk.appCheck!=='function')throw new Error('App Check SDK is unavailable');
    sdk.appCheck().activate(new sdk.appCheck.ReCaptchaEnterpriseProvider(config.siteKey),true);
    activated=true;
    return true;
  }
  return {activate};
})();
