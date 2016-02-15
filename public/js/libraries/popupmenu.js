var popup_menu;
var popup_config;
var popup_current_object;

$(function()
{
	popup_menu = $("<div id=\"popup_menu\"></div>");
	popup_menu.css({position:"absolute","z-index":"10000","width":"auto"});
	popup_menu.hide();
	popup_menu.appendTo('body');
	popup_menu.mouseenter(function(){
		popup_menu.show();		
	});
	popup_menu.mouseleave(function(){
		popup_menu.hide();
	});
});

jQuery.fn.extend(
{
	popup_redraw : function()
	{
	return this.each(function(){
		if (typeof $(this).data("popup-config").position === 'undefined' || $(this).data("popup-config").position == "left-top")
		{
			popup_menu.css("left",$(this).offset().left);
			popup_menu.css("top",$(this).offset().top);
		}
		else if ($(this).data("popup-config").position == "right-top")
		{
			popup_menu.css("left",$(this).offset().left+($(this).width()-popup_menu.width()));
			popup_menu.css("top",$(this).offset().top);				
		}
		else if ($(this).data("popup-config").position == "right-bottom")
		{
			popup_menu.css("left",$(this).offset().left+($(this).width()-popup_menu.width()));
			popup_menu.css("top",$(this).offset().top+($(this).height()-popup_menu.height()));						
		}
		else if ($(this).data("popup-config").position == "left-bottom")
		{
			popup_menu.css("left",$(this).offset().left);
			popup_menu.css("top",$(this).offset().top+($(this).height()-popup_menu.height()));						
		}
		});
	},
	popup_close: function()
	{
	return this.each(function()
		{
			$(this).off("mouseenter.popup");
			$(this).off("mouseleave.popup");
		});
	},
	
	popup: function(config)
	{
		return this.each(function(){
			$(this).on("mouseenter.popup",function()
			{		
				var obj = $(this);
				popup_current_object = obj;
				obj.data("popup-config",config);
				popup_menu.html("");
				for (item in config.items)
				{
					if(config.items.hasOwnProperty(item))
					{
						var new_item = $("<p></p>").appendTo(popup_menu);
						if (typeof config.items[item].icon === 'string')
						{
							var img = $("<img />").appendTo(new_item);
							img.css("margin-right","3px");
							img.attr("src",config.items[item].icon);
							img.load(function(){
								obj.popup_redraw();
							});							
						}
												
						new_item.css({
									"border-right":"1px solid #F0F0F0",
									"border-left":"1px solid #F0F0F0",
									"border-bottom":"1px solid #F0F0F0",
									"background-color":"white",
									"text-align":"left",
									"margin":"0",
									});		
						if (typeof config.items[item].enabled !== 'boolean' || config.items[item].enabled)
						{
							new_item.click(config.items[item].action);
							new_item.mouseenter(function(){
								$(this).css("background-color", "#F0F0F0");
							});
							new_item.mouseleave(function(){
								$(this).css("background-color", "white");
							});	
							new_item.css({cursor:"pointer"});
						}
						else
							new_item.css("color","gray");
						
						new_item.append(config.items[item].title);
					}
				}
				
				popup_menu.first().css("border-top","1px solid #F0F0F0");
				obj.popup_redraw();
				
				popup_menu.show();
			});
			$(this).on("mouseleave.popup",function()
			{
				popup_menu.hide();
			});	
		});
	}
});