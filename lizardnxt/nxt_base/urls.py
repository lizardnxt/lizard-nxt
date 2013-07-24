from django.conf.urls import url, patterns

urlpatterns = patterns('',
    url(r'^$', 'nxt_base.views.index', name='index'),
    url(r'^jsonp/.*$', 'nxt_base.views.jsonp_view', name='jsonp'),
)
