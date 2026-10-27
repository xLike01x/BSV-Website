/**
 * Läuft im <head> jeder Seite, bevor etwas gezeichnet wird: Auf der Startseite merkt es sich den ersten Aufruf pro Besuch
 * (sessionStorage) und setzt <html data-intro="laeuft"> bzw. "gesehen". Das CSS blendet das Wappen-Intro bei "gesehen" aus.
 */
export const INTRO_SKRIPT = `(function(){try{if(location.pathname!=='/')return;var d=document.documentElement;if(sessionStorage.getItem('bsv-intro')){d.setAttribute('data-intro','gesehen')}else{sessionStorage.setItem('bsv-intro','1');d.setAttribute('data-intro','laeuft')}}catch(e){}})()`
