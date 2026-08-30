/* Ajuste visual da escala de humor: preenchimento mais saturado, contorno luminoso e glow preservado. */
(function ensureMoodSaturationStyles(){
  if(document.getElementById('mood-saturation-style'))return;
  const st=document.createElement('style');
  st.id='mood-saturation-style';
  st.textContent=`
.mood-score{
  --mood-color:hsl(var(--mood-h) 94% 50%);
  border:1.25px solid color-mix(in srgb,var(--mood-color) 74%,transparent)!important;
  background:color-mix(in srgb,var(--mood-color) 31%,transparent)!important;
  box-shadow:
    0 0 0 1px color-mix(in srgb,var(--mood-color) 18%,transparent),
    0 0 11px color-mix(in srgb,var(--mood-color) 31%,transparent),
    inset 0 0 10px color-mix(in srgb,var(--mood-color) 10%,transparent);
  transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.mood-score.selected{
  background:hsl(var(--mood-h) 94% 46%)!important;
  border-color:hsl(var(--mood-h) 100% 58%)!important;
  color:#fff!important;
  transform:scale(1.07);
  box-shadow:
    0 0 0 1px color-mix(in srgb,hsl(var(--mood-h) 100% 62%) 82%,transparent),
    0 0 15px color-mix(in srgb,var(--mood-color) 58%,transparent),
    0 0 28px color-mix(in srgb,var(--mood-color) 28%,transparent),
    inset 0 1px 0 rgba(255,255,255,.18);
}
.mood-score:active{transform:scale(.96)}
@media(prefers-reduced-motion:reduce){.mood-score{transition:none!important}}
`;
  document.head.appendChild(st);
})();
