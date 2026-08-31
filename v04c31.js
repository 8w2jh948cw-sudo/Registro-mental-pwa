/* 0.4.31 — novo ícone circular de fechamento. */
const RM_V31_RELEASE='0.4.31';
const RM_V31_CLOSE_ICON="<svg class=\"rm-close-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20.7578 20.3672\" aria-hidden=\"true\" focusable=\"false\"><g><rect height=\"20.3672\" opacity=\"0\" width=\"20.7578\" x=\"0\" y=\"0\"/><path d=\"M20.3516 10.1797C20.3516 15.7812 15.7812 20.3516 10.1719 20.3516C4.57031 20.3516 0 15.7812 0 10.1797C0 4.57031 4.57031 0 10.1719 0C15.7812 0 20.3516 4.57031 20.3516 10.1797ZM13.25 6.125L10.1819 9.17967L7.11719 6.125C6.96875 5.98438 6.80469 5.91406 6.60938 5.91406C6.20312 5.91406 5.88281 6.21875 5.88281 6.60938C5.88281 6.8125 5.96094 6.99219 6.10156 7.13281L9.16294 10.1942L6.10156 13.2422C5.96094 13.3906 5.88281 13.5625 5.88281 13.7578C5.88281 14.1562 6.20312 14.4766 6.60938 14.4766C6.8125 14.4766 6.98438 14.3984 7.13281 14.2578L10.1797 11.2109L13.2266 14.2578C13.3672 14.3984 13.5391 14.4766 13.75 14.4766C14.1484 14.4766 14.4688 14.1562 14.4688 13.7578C14.4688 13.5625 14.3984 13.3906 14.2578 13.2422L11.1981 10.1925L14.2578 7.13281C14.3984 6.99219 14.4688 6.8125 14.4688 6.60938C14.4688 6.21875 14.1484 5.91406 13.75 5.91406C13.5547 5.91406 13.3828 5.98438 13.25 6.125Z\" fill=\"currentColor\" fill-opacity=\"0.85\"/></g></svg>";

function rmV31EnsureStyles(){
  if(document.getElementById('rm-v31-style'))return;
  const st=document.createElement('style');
  st.id='rm-v31-style';
  st.textContent=`
.rm-close-icon{
  display:block;
  width:24px;
  height:24px;
  pointer-events:none;
}
.sheet-close{
  font-size:0!important;
}
`;
  document.head.appendChild(st);
}

function rmV31ApplyCloseIcons(root=document){
  root.querySelectorAll?.('button[aria-label="Fechar"],button.sheet-close').forEach(button=>{
    if(!button.querySelector('.rm-close-icon'))button.innerHTML=RM_V31_CLOSE_ICON;
  });
}

function rmV31Finalize(){
  rmV31EnsureStyles();
  rmV31ApplyCloseIcons(document);
  const top=document.getElementById('topVersion');
  const about=document.getElementById('versionLabel');
  if(top)top.textContent=`v${RM_V31_RELEASE}`;
  if(about)about.textContent=RM_V31_RELEASE;
}
rmV31Finalize();
new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType===1)rmV31ApplyCloseIcons(node.matches?.('button')?node:node);
}))).observe(document.body,{childList:true,subtree:true});
[250,900,1800].forEach(ms=>setTimeout(rmV31Finalize,ms));
