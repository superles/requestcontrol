import test from 'ava';
import {URL} from 'url';
import {RedirectRule} from '../src/RequestControl';

test('Static redirection url', t => {
    const request = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c');
    const target = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/');
    const redirectRule = new RedirectRule('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/');
    t.is(redirectRule.apply(request).href, target.href);
});

test('Pattern expansion - Single', t => {
    const request = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c');
    const target = new URL("https://a.b/path/" + request.search);
    const redirectRule = new RedirectRule("https://a.b/path/{search}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Pattern expansion - Multiple', t => {
    const request = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c');
    const target = new URL(request.protocol + "//" + request.host + request.pathname + request.search + "#myhash");
    const redirectRule = new RedirectRule("{protocol}{host}{pathname}{search}#myhash");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Substring replace pattern', t => {
    const request = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c');
    const target = new URL(request.protocol + "//" + request.host + "/AmazonBasics-Type-C-USB-Male-Cable/my/path/B01GGKYQ02/ref=sr_1_1" + request.search + "#myhash");
    const redirectRule = new RedirectRule("{protocol}{host}{pathname/dp/my\/path}{search}#myhash");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Substring replace pattern - regexp capture groups', t => {
    let request, target, redirectRule;
    request = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/dp/B01GGKYQ02/ref=sr_1_1?s=amazonbasics&srs=10112675011&ie=UTF8&qid=1489067885&sr=8-1&keywords=usb-c');
    target = new URL('https://www.amazon.com/AmazonBasics-Type-C-USB-Male-Cable/foo/B01GGKYQ02/');
    redirectRule = new RedirectRule("{href/(.*?)\\/dp\\/(.*?)\\/ref=.*/$1/foo/$2/}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Substring replace pattern - regexp replace', t => {
    let request, target, redirectRule;
    request = new URL('https://www.dropbox.com/s/vm2mh2lkwsug4gt/rick_morty_at.png?dl=0');
    target = new URL('https://dl.dropboxusercontent.com/s/vm2mh2lkwsug4gt/rick_morty_at.png');
    redirectRule = new RedirectRule("{href/^https?:\\/\\/www\\.dropbox\\.com(\\/s\\/.+\\/.+)\\?dl=\\d$/https://dl.dropboxusercontent.com$1}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Substring replace pattern - regexp repetition quantifiers ', t => {
    let request, target, redirectRule;
    request = new URL('https://i.imgur.com/cijC2a2l.jpg');
    target = new URL('https://i.imgur.com/cijC2a2.jpg');
    redirectRule = new RedirectRule("{origin}{pathname/l\\.([a-zA-Z]{3,4})$/.$1}{search}{hash}");
    t.is(redirectRule.apply(request).href, target.href);

    request = new URL('https://example.com/?1234');
    target = new URL('https://example.com/');
    redirectRule = new RedirectRule("{origin}{pathname}{search/(?:[?&]\\d{4,}?(?=$|[?#])|([?&])\\d{4,}?[?&])/$1}{hash}");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Substring extraction pattern', t => {
    let request, target, redirectRule;
    request = new URL('https://foo.bar/path');
    target = new URL('http://bar.com/some/new/path');
    redirectRule = new RedirectRule("{protocol:0:4}://{host:-3}.com/some/new/path");
    t.is(redirectRule.apply(request).href, target.href);
});

test('String manipulations combined', t => {
    let request, target, redirectRule;
    request = new URL('http://foo.bar.co.uk/path');
    target = new URL('https://bar.com/some/new/path');
    redirectRule = new RedirectRule("https://{host::-3|/\\.co$/.com|:4}/some/new/path");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Redirect instructions - single', t => {
    let request, target, redirectRule;
    request = new URL('http://foo.bar.co.uk/path');
    target = new URL('http://foo.bar.co.uk:8080/path');
    redirectRule = new RedirectRule("[port=8080]");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Redirect instructions - multiple', t => {
    let request, target, redirectRule;
    request = new URL('http://foo.bar.co.uk/path');
    target = new URL('http://localhost:8080/path');
    redirectRule = new RedirectRule("[host=localhost][port=8080]");
    t.is(redirectRule.apply(request).href, target.href);
});

test('Redirect instructions - combined', t => {
    let request, target, redirectRule;
    request = new URL('http://foo.bar.co.uk/path');
    target = new URL('https://bar.com:1234/some/new/path?foo=bar#foobar');
    redirectRule = new RedirectRule("ht[port=1234]tps://{host::-3|/\\.co$/.com|:4}/some/new/path[hash=foobar][search=foo=bar]");
    t.is(redirectRule.apply(request).href, target.href);
});