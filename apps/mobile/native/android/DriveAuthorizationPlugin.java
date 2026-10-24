package com.ieumoffice.mobile.prototype;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;

/** Uses Google's system authorization UI. It never loads a Google login page in the WebView. */
@CapacitorPlugin(name = "DriveAuthorization")
public class DriveAuthorizationPlugin extends Plugin {
    private static final String SCOPE = "https://www.googleapis.com/auth/drive.file";
    private PluginCall pending;
    private ActivityResultLauncher<IntentSenderRequest> resolution;

    @Override
    public void load() {
        resolution = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(), result -> {
                PluginCall call = pending;
                pending = null;
                if (call == null) return;
                try {
                    finish(call, Identity.getAuthorizationClient(getActivity())
                        .getAuthorizationResultFromIntent(result.getData()));
                } catch (Exception ignored) {
                    call.reject("drive-authorization-cancelled");
                }
            }
        );
    }

    @PluginMethod
    public void authorize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pending != null) { call.reject("drive-authorization-busy"); return; }
            pending = call;
            AuthorizationRequest request = AuthorizationRequest.builder()
                .setRequestedScopes(Collections.singletonList(new Scope(SCOPE))).build();
            Identity.getAuthorizationClient(getActivity()).authorize(request)
                .addOnSuccessListener(result -> {
                    if (result.hasResolution() && result.getPendingIntent() != null) {
                        try {
                            resolution.launch(new IntentSenderRequest.Builder(result.getPendingIntent().getIntentSender()).build());
                        } catch (Exception ignored) {
                            pending = null;
                            call.reject("drive-authorization-unavailable");
                        }
                    } else {
                        pending = null;
                        finish(call, result);
                    }
                })
                .addOnFailureListener(ignored -> {
                    pending = null;
                    call.reject("drive-authorization-failed");
                });
        });
    }

    private void finish(PluginCall call, AuthorizationResult result) {
        if (result.getAccessToken() == null || !result.getGrantedScopes().contains(SCOPE)) {
            call.reject("drive-authorization-denied");
            return;
        }
        JSObject response = new JSObject();
        response.put("accessToken", result.getAccessToken());
        response.put("scopes", new JSArray(result.getGrantedScopes()));
        call.resolve(response);
    }
}
