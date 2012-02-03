package com.tongshare.expirelist;

import android.app.Activity;
import android.os.Bundle;
import com.phonegap.*;
import com.phonegap.tryagain.R;

public class ExpireListActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
    }
}