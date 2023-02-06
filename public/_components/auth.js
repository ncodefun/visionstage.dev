import { log, Component, html, define, cache, icon, unsafeHTML, classes, ifDefined }
	from '../vision-stage/vision-stage.min.js'

import { nextFrame, strIf, q }
	from '/vision-stage/utils.js'

const FIREBASE_CONFIG = null

const app = q('vision-stage')

class Auth extends Component {

	onConnected(){
		if( !this.firebase_initialized)
			this.initFirebase()
		this.render()
	}

	onRendered(){}

	initFirebase(){
		this.firebase_initialized = true
		try {
			if( !FIREBASE_CONFIG)
				log('err', 'No default firebase_config nor App.firebase_config')
			//this.firebase_default = firebase
			this.firebase = firebase.initializeApp( FIREBASE_CONFIG) //, 'apps')
			this.auth = this.firebase.auth()
			this.auth.languageCode = app.language
			this.auth.onAuthStateChanged( this.onAuthStateChanged.bind( this))
		}
		catch( err){
			alert("Problème avec le service d'authentification de Google (Firebase).")
		}

	}

	template = () => cache(
		this.user_is_auth ? this.templateAuth() :
		this.signup ? this.templateSignUp() :
		this.templateSignIn()
	)

	templateSignIn = () => html`
		<section id='auth-message' flow>

		</section>

		<section id='auth-inputs' flow>
			<form action='' flow='col'>

				<div flow='row' class='input email'>
					<div flow class='icon abs left'>${ icon('envelope') }</div>
					<input required
						id='user-email'
						type='email'
						autocomplete='username email'
						pattern='\\S+@\\S+?\\.\\S{2,}'
						placeholder=${ this.$email }
						value=${ this.email }
						@input=${ this.onEmailInput }>
				</div>

				<div flow='row' class='input password'>
					<div flow class='icon abs left'>${icon('padlock','','xMidYMid meet')}</div>
					<input required
						id='user-password-input'
						type=${ this.show_password ? 'text':'password' }
						placeholder=${ this.$password }
						autocomplete='current-password'
						pattern='.{6,}'
						@input=${ this.onPasswordInput }
						@keydown=${ this.signinOnEnter }
						@invalid=${ e => e.target.setCustomValidity( this.$password_format) }>
					<button type='button' id='btn-show-password' class='round bare'
						@pointerup=${ e => this.show_password = !this.show_password }>
						${ icon( 'eye-' + (this.show_password ? "hide" : "show") )}
					</button>
				</div>

			</form>
		</section>
	`

	templateAuth = () => html`
		<section id='auth-unverified'>

		</section>

		<section id='auth-infos'>
			<button @pointerup=${ this.signOut }>${ this.$logout }</button>
		</section>
	`

	onAuthStateChanged( user){
		this.user = user || null

	}

	onEmailInput( e){
		this.user_email = e.target.value
		this.register_user_password = ''
		this.message = ''
		e.target.setCustomValidity('')
	}

	onPasswordInput( e){
		this.user_password = e.target.value
		e.target.setCustomValidity('')
	}

	signOut( e){
		this.firebase.auth().signOut()
		this.user_password = null
		this.message = ''
	}

	signUp( e){
		this.show_password = false
		if( q('form.signup').reportValidity()){
			const confirm_password = this.q('#user-password2').value

			if( this.user_password === confirm_password){
				this.firebase.auth()
					.createUserWithEmailAndPassword( this.user_email, this.user_password)
					// THEN => ONAUTHCHANGED
					.then( () => {
						// this.just_signed_up = true
						this.message =
						this.message_type =
						this.user_password = ''
						this.send_email_verification = true
						this.waiting = false
						this.form = 'signin' // will hide b/c !!user
					})
					.catch( err => {
						this.message = this.getString( err.code)
						this.message_type = 'error'
						this.waiting = false
					})
			}
			else {
				//log('err','passwords do not match')
				this.message = this.getString('passwords_do_not_match')
				this.message_type = 'error'
				this.waiting = false
			}
		}
		else {
			//q('#btn-ok')
			this.waiting = false
		}
	}

	signIn( e){
		this.show_password = false
		if( this.q('form').reportValidity()){
			this.firebase.auth()
				.signInWithEmailAndPassword( this.user_email, this.user_password)
				// THEN => ONAUTHCHANGED, active_section = scenes
				.then( () => {

					this.message =
					this.message_type =
					this.register_user_password =
					this.user_password = ''
					// this.prevent_auto_signin = true
				})
				//// CANNOT SIGN IN
				.catch( err => {
					log('err', 'FIREBASE ERROR', err.code, err.message)
					this.message = this.getString( err.code) || err.code /// this['$'+err.code]
					this.message_type = 'error'
					this.user_password = ''
				})
		}
		else {
			//q('#btn-ok').waiting = false
		}
	}

	signinOnEnter( e){
		if( e.key==='Enter'){
			q('#btn-ok').waiting = true
			e.preventDefault()
			this.signIn()
		}
	}

	signupOnEnter( e){
		if( e.key==='Enter'){
			q('#btn-ok').waiting = true
			e.preventDefault()
			this.signUp()
		}
	}
}

Auth.strings = {
	login: 			["Sign In", "Connexion"], 		//! comp is bound to use app languages... ?
	logout: 			["Sign Out", "Déconnexion"],
	password_format: ["6 characters minimum", "Minimum 6 caractères"],
}

Auth.properties = {
	user: null,
	user_is_auth: {
		value: false,
	},
	user_is_admin: {
		value: false,
	},
	signup: false,

	// user_is_verified: {
	// 	getter: () => this.user && this.user.emailVerified
	// }
}

define('vs-auth', Auth)
