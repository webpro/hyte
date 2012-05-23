window.app = {};
window.app.templates = {
	"list": new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<ul>");_.b("\n" + i);if(_.s(_.f("names",c,p,1),c,p,0,16,37,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	<li>");_.b(_.v(_.f("name",c,p,0)));_.b("</li>");_.b("\n");});c.pop();}_.b("</ul>");_.b("\n");return _.fl();;}),
	"paragraph": new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<p>");_.b(_.v(_.f("message",c,p,0)));_.b("</p>");_.b("\n");return _.fl();;})
};
