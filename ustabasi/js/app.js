function toggleMenu(){
document.getElementById('navLinks').classList.toggle('active');
}

window.addEventListener('scroll',()=>{

const nav=document.querySelector('nav');

if(window.scrollY>50){
nav.style.background='#050c18';
}
else{
nav.style.background='rgba(7,17,32,.9)';
}

});